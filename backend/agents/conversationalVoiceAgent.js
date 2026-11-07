import groqAdapter from '../integrations/groqAdapter.js';
import sarvamAdapter from '../integrations/sarvamAdapter.js';
import deepgramAdapter from '../integrations/deepgramAdapter.js';
import Call from '../models/Call.js';
import CallTranscript from '../models/CallTranscript.js';
import Lead from '../models/Lead.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import { emitLiveCallUpdate, emitNotification } from '../config/socket.js';

class ConversationalVoiceAgent {
  /**
   * Generates the opening greeting message customized for the lead
   */
  async generateGreeting({ agent, lead }) {
    let greeting = agent.greetingMessage || 'Hello! This is {{agent_name}}, an AI assistant. Am I speaking with {{lead_name}}?';
    greeting = greeting.replace(/{{lead_name}}/g, lead.name || 'there');
    greeting = greeting.replace(/{{agent_name}}/g, agent.name || 'AI Assistant');
    greeting = greeting.replace(/{{company}}/g, lead.company || 'your team');

    // Synthesize opening audio via Sarvam AI
    const audioData = await sarvamAdapter.synthesizeSpeech({
      text: greeting,
      languageCode: agent.language === 'hi' ? 'hi-IN' : 'en-IN',
      speaker: agent.voiceId || 'meera'
    });

    return {
      text: greeting,
      audioBase64: audioData.audioBase64,
      audioUrl: audioData.audioUrl
    };
  }

  /**
   * Retrieves relevant Knowledge Base snippets using keyword and semantic matching
   */
  async retrieveKnowledge(userQuery) {
    if (!userQuery) return '';

    try {
      const words = userQuery
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (words.length === 0) return '';

      const regexQuery = words.map((w) => ({
        $or: [
          { title: { $regex: w, $options: 'i' } },
          { content: { $regex: w, $options: 'i' } },
          { keywords: { $in: [w] } }
        ]
      }));

      const articles = await KnowledgeBase.find({
        isActive: true,
        $or: regexQuery
      })
        .limit(3)
        .select('title category content');

      if (!articles || articles.length === 0) return '';

      return articles
        .map((a) => `[Category: ${a.category.toUpperCase()}] ${a.title}:\n${a.content}`)
        .join('\n---\n');
    } catch (err) {
      console.error('Knowledge retrieval error:', err.message);
      return '';
    }
  }

  /**
   * Evaluates if caller wants a human handoff or DNC opt-out
   */
  checkQuickTriggers(agent, text) {
    const lower = text.toLowerCase();
    const handoffTriggers = agent.humanHandoffKeywords || ['human', 'manager', 'agent', 'real person', 'baat karwao'];
    const optOutTriggers = agent.optOutKeywords || ['stop calling', 'not interested', 'dnc', 'remove me', 'mat karo call'];

    const isHandoff = handoffTriggers.some((t) => lower.includes(t.toLowerCase()));
    const isOptOut = optOutTriggers.some((t) => lower.includes(t.toLowerCase()));

    return { isHandoff, isOptOut };
  }

  /**
   * Core multi-turn interaction handler:
   * Called when caller speaks (transcribed via Deepgram)
   */
  async processCallerUtterance({ callId, callerText, durationSeconds = 0 }) {
    const call = await Call.findById(callId).populate('lead agent campaign');
    if (!call) throw new Error('Call not found');

    const agent = call.agent;
    const lead = call.lead;

    // Fetch existing transcript
    let transcriptDoc = await CallTranscript.findOne({ call: callId });
    if (!transcriptDoc) {
      transcriptDoc = new CallTranscript({
        call: callId,
        messages: []
      });
    }

    // 1. Record lead's utterance
    transcriptDoc.messages.push({
      speaker: 'lead',
      text: callerText,
      timestamp: new Date()
    });

    // 2. Check quick triggers (human handoff, DNC)
    const { isHandoff, isOptOut } = this.checkQuickTriggers(agent, callerText);

    if (isOptOut) {
      // Mark lead as DNC immediately to respect compliance
      await Lead.findByIdAndUpdate(lead._id, {
        isDNC: true,
        status: 'Unreachable',
        lastCallOutcome: 'Not Interested'
      });

      const responseText = agent.language === 'hi'
        ? `Samajh gaya ${lead.name} ji. Hum aapka number Do Not Call list me add kar rahe hain. Aapka din shubh ho.`
        : `Understood, ${lead.name}. I have marked your preference and updated our Do Not Call list. Thank you and have a great day.`;

      transcriptDoc.messages.push({
        speaker: 'ai',
        text: responseText,
        timestamp: new Date()
      });

      await transcriptDoc.save();

      // Wrap up call
      call.status = 'completed';
      call.outcome = 'Not Interested';
      call.duration = durationSeconds;
      call.endTime = new Date();
      call.interestScore = 10;
      await call.save();

      emitLiveCallUpdate(call);

      return {
        replyText: responseText,
        shouldEndCall: true,
        outcome: 'Not Interested'
      };
    }

    if (isHandoff) {
      const responseText = agent.language === 'hi'
        ? `Zaroor ${lead.name} ji, maine aapki request note kar li hai. Hamara senior executive aapse jald hi call karega.`
        : `I completely understand, ${lead.name}. I am flagging your profile for immediate human follow-up. Our specialist will reach out to you shortly.`;

      transcriptDoc.messages.push({
        speaker: 'ai',
        text: responseText,
        timestamp: new Date()
      });

      await transcriptDoc.save();

      call.status = 'completed';
      call.outcome = 'Human Handoff Requested';
      call.humanHandoffRequired = true;
      call.humanHandoffReason = `Lead explicitly requested human representation: "${callerText}"`;
      call.duration = durationSeconds;
      call.endTime = new Date();
      call.interestScore = 80;
      await call.save();

      emitLiveCallUpdate(call);
      emitNotification({
        type: 'warning',
        title: 'Human Handoff Requested',
        message: `Lead ${lead.name} (${lead.phoneNumber}) requested a human representative.`
      });

      return {
        replyText: responseText,
        shouldEndCall: true,
        outcome: 'Human Handoff Requested'
      };
    }

    // 3. Retrieve relevant Knowledge Base facts
    const knowledgeContext = await this.retrieveKnowledge(callerText);

    // 4. Generate AI response via Groq
    const groqResult = await groqAdapter.generateResponse({
      systemPrompt: agent.systemPrompt,
      conversationHistory: transcriptDoc.messages,
      leadName: lead.name,
      leadData: { company: lead.company, location: lead.location },
      knowledgeContext,
      language: agent.language
    });

    // 5. Synthesize speech via Sarvam AI
    const speechResult = await sarvamAdapter.synthesizeSpeech({
      text: groqResult.text,
      languageCode: agent.language === 'hi' ? 'hi-IN' : 'en-IN',
      speaker: agent.voiceId || 'meera'
    });

    // 6. Record AI utterance
    transcriptDoc.messages.push({
      speaker: 'ai',
      text: groqResult.text,
      timestamp: new Date(),
      audioUrl: speechResult.audioUrl
    });

    await transcriptDoc.save();

    // Update live call state
    call.status = 'in-progress';
    call.duration = durationSeconds;
    await call.save();

    emitLiveCallUpdate(call);

    return {
      replyText: groqResult.text,
      audioBase64: speechResult.audioBase64,
      audioUrl: speechResult.audioUrl,
      shouldEndCall: false
    };
  }

  /**
   * Finalizes call, produces AI summary, scores interest, updates stats
   */
  async finalizeCall(callId) {
    const call = await Call.findById(callId).populate('lead agent campaign');
    if (!call) return;

    const transcriptDoc = await CallTranscript.findOne({ call: callId });
    const messages = transcriptDoc?.messages || [];

    // Run Groq comprehensive call analysis
    const analysis = await groqAdapter.analyzeCallTranscript({
      transcript: messages,
      leadName: call.lead?.name || 'Lead',
      campaignScript: call.campaign?.script || ''
    });

    // Persist final call metrics
    call.status = 'completed';
    call.outcome = analysis.outcome || call.outcome || 'Completed';
    call.interestScore = analysis.interestScore || 50;
    call.sentiment = analysis.sentiment || 'Neutral';
    call.customerIntent = analysis.customerIntent || 'Inquiry';
    call.objections = analysis.objections || [];
    call.humanHandoffRequired = analysis.humanHandoffRequired || call.humanHandoffRequired || false;
    if (analysis.humanHandoffReason) {
      call.humanHandoffReason = analysis.humanHandoffReason;
    }
    call.endTime = new Date();
    await call.save();

    // Update transcript summary and key takeaways
    if (transcriptDoc) {
      transcriptDoc.summary = analysis.summary;
      transcriptDoc.keyTakeaways = analysis.keyTakeaways || [];
      transcriptDoc.actionItems = analysis.actionItems || [];
      await transcriptDoc.save();
    }

    // Update Lead stats
    if (call.lead) {
      const lead = await Lead.findById(call.lead._id);
      if (lead) {
        lead.status = 'Completed';
        lead.lastCallDate = new Date();
        lead.lastCallStatus = 'Completed';
        lead.lastCallOutcome = call.outcome;
        lead.interestScore = call.interestScore;
        lead.attemptsCount += 1;
        await lead.save();
      }
    }

    emitLiveCallUpdate(call);
    return call;
  }
}

export const conversationalVoiceAgent = new ConversationalVoiceAgent();
export default conversationalVoiceAgent;
