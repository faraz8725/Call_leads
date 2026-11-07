import Groq from 'groq-sdk';
import { env } from '../config/env.js';

class GroqAdapter {
  constructor() {
    this.apiKey = env.GROQ_API_KEY;
    this.model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.client = null;

    if (this.apiKey) {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
      } catch (err) {
        console.error('Groq client init error:', err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  setApiKey(key, model) {
    this.apiKey = key;
    if (model) this.model = model;
    if (key) {
      this.client = new Groq({ apiKey: key });
    }
  }

  /**
   * Generates a conversational response given system prompt, conversation history, and KB context.
   */
  async generateResponse({
    systemPrompt,
    conversationHistory = [],
    leadName = 'Customer',
    leadData = {},
    knowledgeContext = '',
    language = 'en'
  }) {
    if (!this.isConfigured() || !this.client) {
      return this._fallbackConversationalResponse({
        conversationHistory,
        leadName,
        language
      });
    }

    try {
      const languageInstruction =
        language === 'hi'
          ? 'Respond strictly in natural, professional spoken Hindi (Devanagari or Romanized according to user input).'
          : language === 'hi-en'
          ? 'Respond in natural, conversational Hinglish (blend of Hindi and English words common in Indian business conversations).'
          : 'Respond in clear, professional, concise English suitable for a phone call.';

      const kbInstruction = knowledgeContext
        ? `\n\nOFFICIAL KNOWLEDGE BASE FACTS (Never contradict these, never hallucinate beyond them):\n${knowledgeContext}`
        : '';

      const enrichedSystemPrompt = `${systemPrompt}
      
CRITICAL CALLING RULES:
1. You are on an active phone call. Keep responses SHORT, engaging, and conversational (1 to 3 sentences maximum).
2. Avoid bullet points, Markdown headings, or long paragraphs—people cannot hear visual formatting on a phone!
3. The lead's name is "${leadName}". Company: "${leadData.company || 'N/A'}".
4. ${languageInstruction}${kbInstruction}
5. If the lead asks a question you do not know the answer to, politely state: "I don't have that exact detail right here, but I can have our senior specialist follow up with you directly."
6. If the lead sounds busy or asks for a callback, immediately offer to schedule a convenient time.
7. If the lead firmly requests a human or supervisor, politely acknowledge: "I completely understand. Let me arrange for a human team member to connect with you."`;

      const messages = [
        { role: 'system', content: enrichedSystemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.speaker === 'ai' ? 'assistant' : 'user',
          content: msg.text
        }))
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.65,
        max_tokens: 250
      });

      const responseText = completion.choices[0]?.message?.content || '';
      return {
        text: responseText.trim(),
        tokensUsed: completion.usage?.total_tokens || 0,
        model: this.model
      };
    } catch (error) {
      console.error('Groq generation error:', error.message);
      return this._fallbackConversationalResponse({ conversationHistory, leadName, language });
    }
  }

  /**
   * Analyzes an entire completed call transcript to classify outcome, sentiment, interest score, and objections.
   */
  async analyzeCallTranscript({ transcript = [], leadName = 'Customer', campaignScript = '' }) {
    const formattedTranscript = transcript
      .map((t) => `${t.speaker === 'ai' ? 'AI Agent' : leadName}: ${t.text}`)
      .join('\n');

    if (!this.isConfigured() || !this.client) {
      return this._fallbackAnalysis(transcript);
    }

    try {
      const prompt = `Analyze this sales call transcript between an AI Calling Agent and a lead named "${leadName}".
Campaign Context/Script: "${campaignScript}"

TRANSCRIPT:
${formattedTranscript}

You MUST return STRICT JSON with the following schema (no markdown formatting, no code fences):
{
  "outcome": "Interested" | "Not Interested" | "Callback Requested" | "Human Handoff Requested" | "No Answer" | "Busy" | "Completed",
  "interestScore": <integer between 0 and 100>,
  "sentiment": "Positive" | "Neutral" | "Negative",
  "summary": "<2-3 sentence executive summary of the conversation>",
  "customerIntent": "<Primary intention or need of the lead>",
  "objections": ["<Objection 1>", "<Objection 2>"],
  "keyTakeaways": ["<Point 1>", "<Point 2>"],
  "actionItems": ["<Action item 1>", "<Action item 2>"],
  "humanHandoffRequired": <true or false>,
  "humanHandoffReason": "<Explanation if true, else empty string>"
}`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return result;
    } catch (error) {
      console.error('Groq call analysis error:', error.message);
      return this._fallbackAnalysis(transcript);
    }
  }

  /**
   * Intelligent fallback logic when Groq API key is not yet configured
   */
  _fallbackConversationalResponse({ conversationHistory, leadName, language }) {
    const lastUserMessage = conversationHistory
      .filter((m) => m.speaker === 'lead')
      .slice(-1)[0]?.text?.toLowerCase() || '';

    // Intent detection heuristics for simulator and fallback
    if (lastUserMessage.includes('who are you') || lastUserMessage.includes('kaun ho')) {
      return {
        text: `I am an AI Voice Assistant calling on behalf of our team to see if you would be interested in accelerating your sales operations. Am I speaking with ${leadName}?`,
        tokensUsed: 42,
        model: 'simulated-groq-engine'
      };
    }

    if (lastUserMessage.includes('yes') || lastUserMessage.includes('haan') || lastUserMessage.includes('speaking') || lastUserMessage.includes('tell me more')) {
      return {
        text: `Wonderful! We help companies scale outbound outreach and qualify leads 10x faster using conversational AI voice agents. Would you like a quick 5-minute walkthrough this week?`,
        tokensUsed: 48,
        model: 'simulated-groq-engine'
      };
    }

    if (lastUserMessage.includes('pricing') || lastUserMessage.includes('cost') || lastUserMessage.includes('price') || lastUserMessage.includes('kitna')) {
      return {
        text: `Our plans are highly flexible, starting at just standard per-minute telephony with zero setup cost. Shall I send our detailed pricing deck directly to your email?`,
        tokensUsed: 45,
        model: 'simulated-groq-engine'
      };
    }

    if (lastUserMessage.includes('busy') || lastUserMessage.includes('later') || lastUserMessage.includes('call back') || lastUserMessage.includes('baad me')) {
      return {
        text: `I completely understand, ${leadName}. When would be the best time for us to give you a quick callback?`,
        tokensUsed: 35,
        model: 'simulated-groq-engine'
      };
    }

    if (lastUserMessage.includes('human') || lastUserMessage.includes('person') || lastUserMessage.includes('agent') || lastUserMessage.includes('baat karwao')) {
      return {
        text: `Certainly! I will flag your file immediately so one of our senior executives connects directly with you. Thank you for your time!`,
        tokensUsed: 38,
        model: 'simulated-groq-engine'
      };
    }

    if (lastUserMessage.includes('not interested') || lastUserMessage.includes('no') || lastUserMessage.includes('stop') || lastUserMessage.includes('nahi')) {
      return {
        text: `Understood, ${leadName}. We will respect your preference and mark your number as Do Not Call. Have a great day ahead!`,
        tokensUsed: 32,
        model: 'simulated-groq-engine'
      };
    }

    // Default polite engagement
    return {
      text: `Thank you for sharing that, ${leadName}. We specialize in high-efficiency AI voice automation. Does your company currently make outbound sales or support calls?`,
      tokensUsed: 36,
      model: 'simulated-groq-engine'
    };
  }

  _fallbackAnalysis(transcript) {
    const fullText = transcript.map((t) => t.text.toLowerCase()).join(' ');

    let outcome = 'Completed';
    let sentiment = 'Neutral';
    let interestScore = 65;
    let handoff = false;
    let handoffReason = '';

    if (fullText.includes('human') || fullText.includes('manager') || fullText.includes('real person')) {
      outcome = 'Human Handoff Requested';
      sentiment = 'Neutral';
      interestScore = 75;
      handoff = true;
      handoffReason = 'Lead explicitly asked to talk with a human team member.';
    } else if (fullText.includes('not interested') || fullText.includes('stop') || fullText.includes('no thanks')) {
      outcome = 'Not Interested';
      sentiment = 'Negative';
      interestScore = 15;
    } else if (fullText.includes('call back') || fullText.includes('later') || fullText.includes('busy')) {
      outcome = 'Callback Requested';
      sentiment = 'Neutral';
      interestScore = 55;
    } else if (fullText.includes('yes') || fullText.includes('pricing') || fullText.includes('demo') || fullText.includes('interested')) {
      outcome = 'Interested';
      sentiment = 'Positive';
      interestScore = 88;
    }

    return {
      outcome,
      interestScore,
      sentiment,
      summary: `Automated call summary: Lead engaged in a conversation with the AI agent. Final classification determined as ${outcome} with a sentiment rating of ${sentiment}.`,
      customerIntent: outcome === 'Interested' ? 'Product Information & Demo' : outcome === 'Callback Requested' ? 'Follow-up at a later time' : 'General Inquiry',
      objections: outcome === 'Not Interested' ? ['Budget or Timing', 'Existing solution in place'] : [],
      keyTakeaways: [
        'Lead verified identity upon greeting.',
        `AI conveyed core campaign value proposition. Outcome: ${outcome}.`
      ],
      actionItems: outcome === 'Interested' ? ['Send proposal / pricing deck', 'Schedule live demo call'] : outcome === 'Human Handoff Requested' ? ['Assign sales manager for direct follow-up'] : ['Archive call log'],
      humanHandoffRequired: handoff,
      humanHandoffReason: handoffReason
    };
  }
}

export const groqAdapter = new GroqAdapter();
export default groqAdapter;
