import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import AIAgent from '../models/AIAgent.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';
import Call from '../models/Call.js';
import CallTranscript from '../models/CallTranscript.js';
import IntegrationSettings from '../models/IntegrationSettings.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected. Clearing existing collections...');

    await Admin.deleteMany({});
    await AIAgent.deleteMany({});
    await KnowledgeBase.deleteMany({});
    await Lead.deleteMany({});
    await Campaign.deleteMany({});
    await Call.deleteMany({});
    await CallTranscript.deleteMany({});
    await IntegrationSettings.deleteMany({});

    console.log('👤 Creating default Superadmin...');
    const admin = await Admin.create({
      name: 'Alex Vance',
      email: 'admin@voicecall.ai',
      password: 'Admin@12345',
      role: 'superadmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isActive: true
    });

    console.log('🤖 Creating AI Agents...');
    const agentMaya = await AIAgent.create({
      name: 'Maya - Enterprise Sales Specialist',
      description: 'Consultative B2B sales development representative trained to qualify inbound/outbound enterprise leads.',
      personality: 'Empathetic, articulate, consultative, and value-oriented.',
      language: 'en',
      voiceProvider: 'sarvam',
      voiceId: 'meera',
      speakingStyle: 'Professional',
      speakingRate: 1.0,
      systemPrompt: `You are Maya, a professional Senior Business Development Representative at Nexus Voice Solutions.
Your goal is to understand the lead's current customer outreach challenges, introduce our AI Voice Calling platform, and secure interest for a live product demo.
Always identify yourself as an AI assistant.
Speak concisely in 1-2 punchy sentences.
Listen actively, confirm their pain points, and offer solutions based on our official knowledge base.
If the customer asks for a human manager or sounds hesitant, gracefully acknowledge and note down a callback.`,
      greetingMessage: 'Hello! This is Maya, an AI assistant calling from Nexus Voice Solutions. Am I speaking with {{lead_name}}?',
      callObjectives: [
        'Confirm lead identity and company role',
        'Inquire about their current outbound call operations',
        'Introduce AI voice calling automation and cost savings',
        'Book a 15-minute product walkthrough'
      ],
      maxCallDuration: 300,
      humanHandoffKeywords: ['human', 'manager', 'supervisor', 'agent', 'real person', 'executive'],
      optOutKeywords: ['stop', 'not interested', 'dnc', 'remove me', 'do not call'],
      createdBy: admin._id
    });

    const agentAarav = await AIAgent.create({
      name: 'Aarav - Hindi / Hinglish FinTech Advisor',
      description: 'Fluent conversational bilingual assistant specializing in Indian business outreach and loan/insurance qualification.',
      personality: 'Polite, persuasive, respectful, and culturally native.',
      language: 'hi-en',
      voiceProvider: 'sarvam',
      voiceId: 'arvind',
      speakingStyle: 'Consultative',
      speakingRate: 1.05,
      systemPrompt: `You are Aarav, a friendly and polite financial services consultant.
You converse naturally in spoken Hinglish (a comfortable blend of conversational Hindi and English).
Identify yourself clearly as an AI assistant.
Respect the lead's time and explain our streamlined digital financial solutions clearly.`,
      greetingMessage: 'Namaste! Main Aarav bol raha hoon, Nexus Finance se ek AI assistant. Kya meri baat {{lead_name}} ji se ho rahi hai?',
      callObjectives: [
        'Greet warmly in Hinglish',
        'Check eligibility for commercial credit lines',
        'Collect preferred callback time'
      ],
      maxCallDuration: 300,
      humanHandoffKeywords: ['insaan', 'baat karwao', 'manager', 'executive', 'officer'],
      optOutKeywords: ['mat karo call', 'band karo', 'nahi chahiye', 'stop'],
      createdBy: admin._id
    });

    const agentPriya = await AIAgent.create({
      name: 'Priya - Customer Success & Retention',
      description: 'Dedicated customer success caller for scheduling quarterly business reviews and onboarding check-ins.',
      personality: 'Helpful, warm, solution-focused, and attentive.',
      language: 'en',
      voiceProvider: 'sarvam',
      voiceId: 'pavithra',
      speakingStyle: 'Friendly',
      systemPrompt: 'You are Priya, a customer success specialist dedicated to ensuring clients get maximum value from our voice calling tools.',
      greetingMessage: 'Hi {{lead_name}}! This is Priya from Customer Success. I am checking in to see how your recent campaigns are performing.',
      createdBy: admin._id
    });

    console.log('📚 Creating Knowledge Base entries...');
    await KnowledgeBase.create([
      {
        title: 'Nexus Voice Platform Overview',
        category: 'company',
        content: 'Nexus Voice is an enterprise AI Outbound Voice Calling SaaS platform capable of autonomous multi-lingual outbound conversations. Powered by Groq Llama 3.3 for reasoning, Deepgram Nova-2 for real-time speech-to-text, and Sarvam AI for hyper-natural Indian voices.',
        keywords: ['nexus', 'company', 'about', 'platform', 'ai voice'],
        priority: 10,
        createdBy: admin._id
      },
      {
        title: 'Enterprise Pricing & Usage Billing',
        category: 'pricing',
        content: 'Standard pricing starts at $0.05 per active call minute. No upfront infrastructure costs or hidden per-agent seat licensing. Enterprise high-volume tiers (above 50,000 minutes/month) receive dedicated carrier SIP trunking at $0.035/minute and custom SLA guarantees.',
        keywords: ['pricing', 'cost', 'rates', 'plans', 'minute', 'subscription'],
        priority: 9,
        createdBy: admin._id
      },
      {
        title: 'Supported Languages & Dialects',
        category: 'product',
        content: 'Nexus Voice natively supports English (Global and Indian accents), Hindi (formal & conversational), and Hinglish (code-mixed everyday business dialogue). Additional regional languages include Bengali, Tamil, Telugu, and Marathi.',
        keywords: ['language', 'hindi', 'english', 'hinglish', 'accents'],
        priority: 8,
        createdBy: admin._id
      },
      {
        title: 'CRM Integration & Telephony Carriers',
        category: 'services',
        content: 'Real-time REST APIs, webhooks, and native connectors for Salesforce, HubSpot, Zoho, and Bigin. Outbound telephony is powered by Vobiz SIP trunking with sub-200ms latency audio pipes provided by LiveKit WebRTC.',
        keywords: ['crm', 'hubspot', 'salesforce', 'telephony', 'vobiz', 'livekit'],
        priority: 7,
        createdBy: admin._id
      },
      {
        title: 'Handling "I Am Busy / Call Back Later"',
        category: 'sales',
        content: 'If the lead says they are in a meeting, driving, or busy: "I completely understand! I won’t take your time right now. What day and time later this week works best for a quick 2-minute chat?"',
        keywords: ['busy', 'meeting', 'later', 'callback', 'driving'],
        priority: 6,
        createdBy: admin._id
      }
    ]);

    console.log('📋 Creating Sample Leads...');
    const leads = await Lead.create([
      {
        name: 'Rahul Sharma',
        phoneNumber: '+919876543210',
        email: 'rahul.sharma@apexlogistics.in',
        company: 'Apex Logistics Corp',
        location: 'Mumbai, India',
        status: 'Completed',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 1,
        lastCallStatus: 'Completed',
        lastCallOutcome: 'Interested',
        interestScore: 92,
        notes: 'Very interested in reducing call center costs for shipping tracking.',
        createdBy: admin._id
      },
      {
        name: 'Samantha Reed',
        phoneNumber: '+14155552671',
        email: 'sreed@cloudstride.io',
        company: 'CloudStride Software',
        location: 'San Francisco, CA',
        status: 'Completed',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 1,
        lastCallStatus: 'Completed',
        lastCallOutcome: 'Callback Requested',
        interestScore: 68,
        notes: 'Requested a callback next Tuesday after board meeting.',
        createdBy: admin._id
      },
      {
        name: 'Vikram Mehta',
        phoneNumber: '+919811223344',
        email: 'vikram@mehtafinance.com',
        company: 'Mehta Wealth Advisors',
        location: 'Delhi, India',
        status: 'Completed',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 2,
        lastCallStatus: 'Completed',
        lastCallOutcome: 'Human Handoff Requested',
        interestScore: 84,
        notes: 'Explicitly asked to talk with enterprise sales architect regarding data residency.',
        createdBy: admin._id
      },
      {
        name: 'Ananya Roy',
        phoneNumber: '+919748123456',
        email: 'ananya@healthfirst.in',
        company: 'HealthFirst Diagnostics',
        location: 'Bengaluru, India',
        status: 'Completed',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 1,
        lastCallStatus: 'Completed',
        lastCallOutcome: 'Interested',
        interestScore: 95,
        notes: 'Wants autonomous appointment reminder calls for 10 diagnostic centers.',
        createdBy: admin._id
      },
      {
        name: 'David Chen',
        phoneNumber: '+12065559871',
        email: 'dchen@cascadeanalytics.com',
        company: 'Cascade Analytics',
        location: 'Seattle, WA',
        status: 'New',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 0,
        createdBy: admin._id
      },
      {
        name: 'Kavita Patel',
        phoneNumber: '+919825012345',
        email: 'kavita@pateltextiles.com',
        company: 'Patel Exotics',
        location: 'Ahmedabad, India',
        status: 'New',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 0,
        createdBy: admin._id
      },
      {
        name: 'Rohan Deshmukh',
        phoneNumber: '+919920198765',
        email: 'rohan@deshmukhengineering.in',
        company: 'Deshmukh Heavy Eng',
        location: 'Pune, India',
        status: 'Completed',
        consentStatus: true,
        isDNC: true,
        attemptsCount: 1,
        lastCallStatus: 'Completed',
        lastCallOutcome: 'Not Interested',
        interestScore: 12,
        notes: 'Lead requested Do Not Call removal. Complied immediately.',
        createdBy: admin._id
      },
      {
        name: 'Michael Torres',
        phoneNumber: '+13125557788',
        email: 'mtorres@torreshomes.com',
        company: 'Torres Real Estate',
        location: 'Chicago, IL',
        status: 'New',
        consentStatus: true,
        isDNC: false,
        attemptsCount: 0,
        createdBy: admin._id
      }
    ]);

    console.log('🚀 Creating Sample Calling Campaign...');
    const campaign = await Campaign.create({
      name: 'Q1 Enterprise Outreach - India & Global',
      description: 'Outbound qualification campaign targeting logistics and software leaders.',
      status: 'Running',
      agent: agentMaya._id,
      leads: leads.map((l) => l._id),
      script: 'Qualify outbound lead volume, pitch sub-second voice agent latency, and book demo.',
      language: 'en',
      voiceId: 'meera',
      timezone: 'Asia/Kolkata',
      callingHoursStart: '09:00',
      callingHoursEnd: '20:00',
      maxAttempts: 3,
      concurrencyLimit: 5,
      stats: {
        totalLeads: leads.length,
        processedLeads: 5,
        pendingLeads: 3,
        successfulCalls: 4,
        failedCalls: 1,
        answeredCalls: 4,
        noAnswerCalls: 0,
        busyCalls: 1,
        interestedCount: 2,
        notInterestedCount: 1,
        callbackCount: 1,
        humanHandoffCount: 1,
        totalDurationSeconds: 432
      },
      startedAt: new Date(Date.now() - 3600000 * 4),
      createdBy: admin._id
    });

    // Update leads with campaign ref
    await Lead.updateMany({}, { $addToSet: { campaigns: campaign._id } });

    console.log('📞 Creating Sample Historical Calls with Transcripts...');
    const sampleCall1 = await Call.create({
      providerCallId: 'vobiz_sim_demo_9921',
      telephonyProvider: 'vobiz',
      campaign: campaign._id,
      lead: leads[0]._id, // Rahul Sharma
      agent: agentMaya._id,
      phoneNumber: leads[0].phoneNumber,
      direction: 'outbound',
      status: 'completed',
      outcome: 'Interested',
      startTime: new Date(Date.now() - 3600000 * 2),
      answerTime: new Date(Date.now() - 3600000 * 2 + 3000),
      endTime: new Date(Date.now() - 3600000 * 2 + 115000),
      duration: 112,
      customerIntent: 'Outbound Logistics Automation & Rate Inquiries',
      interestScore: 92,
      sentiment: 'Positive',
      objections: [],
      humanHandoffRequired: false,
      recordingUrl: 'https://actions.google.com/sounds/v1/speech/greeting_sample.ogg'
    });

    await CallTranscript.create({
      call: sampleCall1._id,
      messages: [
        {
          speaker: 'ai',
          text: 'Hello! This is Maya, an AI assistant calling from Nexus Voice Solutions. Am I speaking with Rahul Sharma?',
          timestamp: new Date(Date.now() - 3600000 * 2 + 4000),
          confidence: 0.99
        },
        {
          speaker: 'lead',
          text: 'Yes, Rahul speaking. Who is this again and what is this regarding?',
          timestamp: new Date(Date.now() - 3600000 * 2 + 10000),
          confidence: 0.97
        },
        {
          speaker: 'ai',
          text: 'Hi Rahul! I am reaching out from Nexus Voice Solutions. We help high-growth logistics companies automate outbound shipment delivery calls and lead follow-ups using natural conversational AI voice agents.',
          timestamp: new Date(Date.now() - 3600000 * 2 + 18000),
          confidence: 0.98
        },
        {
          speaker: 'lead',
          text: 'Interesting. We actually spend a lot of time calling consignees to confirm delivery addresses. Can your AI handle Indian regional accents and Hindi?',
          timestamp: new Date(Date.now() - 3600000 * 2 + 32000),
          confidence: 0.96
        },
        {
          speaker: 'ai',
          text: 'Absolutely! Our voice pipeline is powered by Sarvam AI, which natively understands and speaks natural Indian English, Hindi, and everyday Hinglish with realistic human cadence.',
          timestamp: new Date(Date.now() - 3600000 * 2 + 46000),
          confidence: 0.98
        },
        {
          speaker: 'lead',
          text: 'That sounds really promising. What does the pricing structure look like?',
          timestamp: new Date(Date.now() - 3600000 * 2 + 60000),
          confidence: 0.95
        },
        {
          speaker: 'ai',
          text: 'Our standard tier starts at just $0.05 per active call minute with zero setup fees or hardware requirements. Would it make sense to schedule a 15-minute live platform walkthrough for your operations team this Thursday?',
          timestamp: new Date(Date.now() - 3600000 * 2 + 75000),
          confidence: 0.99
        },
        {
          speaker: 'lead',
          text: 'Yes, please send the calendar invite and brochure to my email rahul.sharma@apexlogistics.in. Thursday afternoon works.',
          timestamp: new Date(Date.now() - 3600000 * 2 + 90000),
          confidence: 0.98
        },
        {
          speaker: 'ai',
          text: 'Fantastic! I will dispatch the meeting invitation and overview immediately. Thank you for your time, Rahul, and have a wonderful day!',
          timestamp: new Date(Date.now() - 3600000 * 2 + 105000),
          confidence: 0.99
        }
      ],
      summary: 'Lead Rahul Sharma confirmed his identity and expressed strong interest in using AI voice agents for automated delivery dispatch calls at Apex Logistics. Inquired about Indian accent support and pricing. Confirmed willingness for a live demo on Thursday.',
      keyTakeaways: [
        'High intent lead from logistics vertical',
        'Interested in Hindi and Hinglish voice capabilities',
        'Accepted product demo invitation for Thursday afternoon'
      ],
      actionItems: [
        'Send calendar invite to rahul.sharma@apexlogistics.in',
        'Share product deck and Indian language voice samples',
        'Assign Enterprise Account Executive for Thursday demo'
      ]
    });

    const sampleCall2 = await Call.create({
      providerCallId: 'vobiz_sim_demo_9922',
      telephonyProvider: 'vobiz',
      campaign: campaign._id,
      lead: leads[2]._id, // Vikram Mehta
      agent: agentMaya._id,
      phoneNumber: leads[2].phoneNumber,
      direction: 'outbound',
      status: 'completed',
      outcome: 'Human Handoff Requested',
      startTime: new Date(Date.now() - 3600000 * 1),
      answerTime: new Date(Date.now() - 3600000 * 1 + 2500),
      endTime: new Date(Date.now() - 3600000 * 1 + 78000),
      duration: 75,
      customerIntent: 'Regulatory Compliance & Human Escalation',
      interestScore: 84,
      sentiment: 'Neutral',
      objections: ['Requires SEBI data localization clarity'],
      humanHandoffRequired: true,
      humanHandoffReason: 'Lead asked for technical architect regarding data residency and Indian telecom regulatory compliance.',
      recordingUrl: 'https://actions.google.com/sounds/v1/speech/greeting_sample.ogg'
    });

    await CallTranscript.create({
      call: sampleCall2._id,
      messages: [
        {
          speaker: 'ai',
          text: 'Hello! This is Maya, an AI assistant calling from Nexus Voice Solutions. Am I speaking with Vikram Mehta?',
          timestamp: new Date(Date.now() - 3600000 * 1 + 3000)
        },
        {
          speaker: 'lead',
          text: 'Yes, speaking. We are a SEBI registered wealth firm. Does your calling system store voice recordings in Indian servers?',
          timestamp: new Date(Date.now() - 3600000 * 1 + 18000)
        },
        {
          speaker: 'ai',
          text: 'Yes, we offer localized data residency and encrypted storage complying with Indian telecom standards.',
          timestamp: new Date(Date.now() - 3600000 * 1 + 32000)
        },
        {
          speaker: 'lead',
          text: 'I need to speak directly with your senior technical architect or compliance officer about this before we move forward. Please have someone call me.',
          timestamp: new Date(Date.now() - 3600000 * 1 + 50000)
        },
        {
          speaker: 'ai',
          text: 'I completely understand, Vikram ji. I am flagging your profile for immediate human follow-up. Our compliance specialist will reach out to you directly.',
          timestamp: new Date(Date.now() - 3600000 * 1 + 65000)
        }
      ],
      summary: 'Lead Vikram Mehta from Mehta Wealth Advisors inquired about SEBI regulatory compliance and Indian server data residency. Requested direct human escalation with a technical compliance architect.',
      keyTakeaways: [
        'Wealth advisory firm with high compliance requirements',
        'Direct human escalation initiated upon caller request'
      ],
      actionItems: [
        'Flag lead for Compliance Lead / Solutions Architect',
        'Provide SOC2 and Indian data localization whitepaper'
      ]
    });

    console.log('✅ Database successfully seeded!');
    console.log('--------------------------------------------------');
    console.log('🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('   Email:    admin@voicecall.ai');
    console.log('   Password: Admin@12345');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
