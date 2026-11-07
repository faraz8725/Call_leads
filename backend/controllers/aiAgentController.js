import AIAgent from '../models/AIAgent.js';
import groqAdapter from '../integrations/groqAdapter.js';
import sarvamAdapter from '../integrations/sarvamAdapter.js';
import ActivityLog from '../models/ActivityLog.js';

export const getAgents = async (req, res, next) => {
  try {
    const agents = await AIAgent.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
};

export const getAgentById = async (req, res, next) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'AI Agent not found' });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

export const createAgent = async (req, res, next) => {
  try {
    const {
      name,
      description,
      personality,
      language,
      voiceProvider,
      voiceId,
      speakingStyle,
      speakingRate,
      systemPrompt,
      greetingMessage,
      callObjectives,
      maxCallDuration,
      humanHandoffKeywords,
      optOutKeywords
    } = req.body;

    if (!name || !systemPrompt || !greetingMessage) {
      return res.status(400).json({
        success: false,
        message: 'Name, System Prompt, and Greeting Message are required.'
      });
    }

    const agent = await AIAgent.create({
      name: name.trim(),
      description,
      personality,
      language: language || 'en',
      voiceProvider: voiceProvider || 'sarvam',
      voiceId: voiceId || 'meera',
      speakingStyle: speakingStyle || 'Professional',
      speakingRate: speakingRate || 1.0,
      systemPrompt,
      greetingMessage,
      callObjectives: callObjectives || [],
      maxCallDuration: maxCallDuration || 300,
      humanHandoffKeywords: humanHandoffKeywords || [],
      optOutKeywords: optOutKeywords || [],
      createdBy: req.admin?._id
    });

    await ActivityLog.create({
      admin: req.admin?._id,
      action: 'CREATE_AGENT',
      entityType: 'AIAgent',
      entityId: agent._id.toString(),
      description: `Created AI Calling Agent: "${agent.name}" (${agent.language})`
    });

    res.status(201).json({
      success: true,
      message: 'AI Agent created successfully',
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const agent = await AIAgent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'AI Agent not found' });
    }

    res.status(200).json({
      success: true,
      message: 'AI Agent updated successfully',
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (req, res, next) => {
  try {
    const agent = await AIAgent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'AI Agent not found' });
    }

    res.status(200).json({
      success: true,
      message: 'AI Agent deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/agents/test-chat
 * @desc    Simulate interactive conversation turn for testing prompt and voice
 */
export const testAgentConversation = async (req, res, next) => {
  try {
    const { agentId, userMessage, history = [] } = req.body;

    const agent = await AIAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'AI Agent not found' });
    }

    const conversationHistory = [
      ...history,
      { speaker: 'lead', text: userMessage }
    ];

    const groqResult = await groqAdapter.generateResponse({
      systemPrompt: agent.systemPrompt,
      conversationHistory,
      leadName: 'Alex',
      language: agent.language
    });

    const speechResult = await sarvamAdapter.synthesizeSpeech({
      text: groqResult.text,
      languageCode: agent.language === 'hi' ? 'hi-IN' : 'en-IN',
      speaker: agent.voiceId || 'meera'
    });

    res.status(200).json({
      success: true,
      data: {
        replyText: groqResult.text,
        audioBase64: speechResult.audioBase64,
        audioUrl: speechResult.audioUrl,
        tokensUsed: groqResult.tokensUsed
      }
    });
  } catch (error) {
    next(error);
  }
};
