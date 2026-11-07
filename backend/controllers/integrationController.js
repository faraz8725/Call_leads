import IntegrationSettings from '../models/IntegrationSettings.js';
import groqAdapter from '../integrations/groqAdapter.js';
import deepgramAdapter from '../integrations/deepgramAdapter.js';
import sarvamAdapter from '../integrations/sarvamAdapter.js';
import livekitAdapter from '../integrations/livekitAdapter.js';
import vobizAdapter from '../integrations/vobizAdapter.js';
import { env } from '../config/env.js';

export const getIntegrationStatuses = async (req, res, next) => {
  try {
    const defaultProviders = [
      {
        provider: 'groq',
        displayName: 'Groq API (Llama 3.3)',
        category: 'llm',
        description: 'Ultra-low latency LLM brain for real-time conversation and intent extraction.',
        isConfigured: groqAdapter.isConfigured() || Boolean(env.GROQ_API_KEY),
        model: env.GROQ_MODEL
      },
      {
        provider: 'deepgram',
        displayName: 'Deepgram Speech-to-Text',
        category: 'stt',
        description: 'Nova-2 high accuracy real-time speech transcription.',
        isConfigured: deepgramAdapter.isConfigured() || Boolean(env.DEEPGRAM_API_KEY)
      },
      {
        provider: 'sarvam',
        displayName: 'Sarvam AI Text-to-Speech',
        category: 'tts',
        description: 'Natural Indian English, Hindi, and Hinglish voice synthesis.',
        isConfigured: sarvamAdapter.isConfigured() || Boolean(env.SARVAM_API_KEY)
      },
      {
        provider: 'livekit',
        displayName: 'LiveKit Voice Infrastructure',
        category: 'webrtc',
        description: 'Low-latency WebRTC audio rooms and bi-directional streaming.',
        isConfigured: livekitAdapter.isConfigured() || Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY)
      },
      {
        provider: 'vobiz',
        displayName: 'Vobiz Telephony & SIP',
        category: 'telephony',
        description: 'Outbound carrier calling, PSTN bridging, and call status webhooks.',
        isConfigured: vobizAdapter.isConfigured() || Boolean(env.VOBIZ_API_KEY),
        phoneNumber: env.VOBIZ_PHONE_NUMBER
      }
    ];

    const dbSettings = await IntegrationSettings.find();
    const settingsMap = new Map(dbSettings.map((s) => [s.provider, s]));

    const merged = defaultProviders.map((p) => {
      const dbEntry = settingsMap.get(p.provider);
      return {
        ...p,
        isActive: dbEntry ? dbEntry.isActive : true,
        lastTestedAt: dbEntry?.lastTestedAt || null,
        lastTestStatus: dbEntry?.lastTestStatus || 'untested',
        lastTestMessage: dbEntry?.lastTestMessage || ''
      };
    });

    res.status(200).json({
      success: true,
      data: merged
    });
  } catch (error) {
    next(error);
  }
};

export const updateIntegrationCredentials = async (req, res, next) => {
  try {
    const { provider, credentials } = req.body;

    if (!provider || !credentials) {
      return res.status(400).json({
        success: false,
        message: 'Provider and credentials are required.'
      });
    }

    // Apply to running in-memory adapter
    if (provider === 'groq') {
      groqAdapter.setApiKey(credentials.apiKey, credentials.model);
    } else if (provider === 'deepgram') {
      deepgramAdapter.setApiKey(credentials.apiKey);
    } else if (provider === 'sarvam') {
      sarvamAdapter.setApiKey(credentials.apiKey);
    } else if (provider === 'livekit') {
      livekitAdapter.setCredentials(credentials.host, credentials.apiKey, credentials.apiSecret);
    } else if (provider === 'vobiz') {
      vobizAdapter.setCredentials(
        credentials.apiKey,
        credentials.apiSecret,
        credentials.baseUrl,
        credentials.phoneNumber
      );
    }

    let setting = await IntegrationSettings.findOne({ provider });
    if (!setting) {
      setting = new IntegrationSettings({
        provider,
        displayName: provider.toUpperCase(),
        category:
          provider === 'groq'
            ? 'llm'
            : provider === 'deepgram'
            ? 'stt'
            : provider === 'sarvam'
            ? 'tts'
            : provider === 'livekit'
            ? 'webrtc'
            : 'telephony'
      });
    }

    // Store masked config
    const maskedConfig = {};
    for (const [k, v] of Object.entries(credentials)) {
      if (typeof v === 'string' && v.length > 8) {
        maskedConfig[k] = `${v.slice(0, 4)}...${v.slice(-4)}`;
      } else {
        maskedConfig[k] = v;
      }
    }

    setting.config = maskedConfig;
    setting.isConfigured = true;
    await setting.save();

    res.status(200).json({
      success: true,
      message: `${provider.toUpperCase()} credentials updated successfully.`,
      isConfigured: true
    });
  } catch (error) {
    next(error);
  }
};

export const testIntegration = async (req, res, next) => {
  try {
    const { provider } = req.params;
    let result = { success: false, message: 'Provider test not implemented.' };

    if (provider === 'groq') {
      if (!groqAdapter.isConfigured()) {
        result = { success: false, message: 'Groq API Key is not set.' };
      } else {
        try {
          const resp = await groqAdapter.generateResponse({
            systemPrompt: 'Respond with "Groq connection OK"',
            leadName: 'Tester'
          });
          result = { success: true, message: `Groq connected OK. Model: ${groqAdapter.model}` };
        } catch (e) {
          result = { success: false, message: e.message };
        }
      }
    } else if (provider === 'deepgram') {
      result = await deepgramAdapter.testConnection();
    } else if (provider === 'sarvam') {
      result = await sarvamAdapter.testConnection();
    } else if (provider === 'livekit') {
      result = await livekitAdapter.testConnection();
    } else if (provider === 'vobiz') {
      result = await vobizAdapter.testConnection();
    }

    // Save test result in DB
    await IntegrationSettings.findOneAndUpdate(
      { provider },
      {
        lastTestedAt: new Date(),
        lastTestStatus: result.success ? 'success' : 'failed',
        lastTestMessage: result.message
      },
      { upsert: true }
    );

    res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
