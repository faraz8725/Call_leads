import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import Call from '../models/Call.js';
import CallTranscript from '../models/CallTranscript.js';
import vobizAdapter from '../integrations/vobizAdapter.js';
import conversationalVoiceAgent from '../agents/conversationalVoiceAgent.js';
import { emitLiveCallUpdate, emitCampaignProgress, emitNotification } from '../config/socket.js';

class CallExecutionService {
  constructor() {
    this.activeCampaignJobs = new Map(); // campaignId -> Interval/runner status
    this.activeSimulations = new Map(); // callId -> simulation timer
  }

  /**
   * Validates if current time falls within allowed calling hours
   */
  isWithinCallingHours(campaign) {
    try {
      const now = new Date();
      // Format current time as HH:MM
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      const start = campaign.callingHoursStart || '09:00';
      const end = campaign.callingHoursEnd || '19:00';

      return currentTimeStr >= start && currentTimeStr <= end;
    } catch {
      return true;
    }
  }

  /**
   * Starts or resumes a campaign
   */
  async startCampaign(campaignId) {
    const campaign = await Campaign.findById(campaignId).populate('agent leads');
    if (!campaign) throw new Error('Campaign not found');

    if (!campaign.agent) {
      throw new Error('Campaign has no AI Agent assigned. Please select an agent first.');
    }

    if (campaign.leads.length === 0) {
      throw new Error('Campaign has no leads assigned. Please add leads first.');
    }

    campaign.status = 'Running';
    if (!campaign.startedAt) campaign.startedAt = new Date();
    await campaign.save();

    emitNotification({
      type: 'info',
      title: 'Campaign Started',
      message: `Campaign "${campaign.name}" is now actively dialing leads.`
    });

    // Run dialer loop
    this.processCampaignLeads(campaignId);
    return campaign;
  }

  /**
   * Pauses an active campaign
   */
  async pauseCampaign(campaignId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'Paused';
    await campaign.save();

    if (this.activeCampaignJobs.has(campaignId.toString())) {
      clearInterval(this.activeCampaignJobs.get(campaignId.toString()));
      this.activeCampaignJobs.delete(campaignId.toString());
    }

    emitCampaignProgress(campaignId, { status: 'Paused' });
    return campaign;
  }

  /**
   * Stops a campaign completely
   */
  async stopCampaign(campaignId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'Stopped';
    campaign.completedAt = new Date();
    await campaign.save();

    if (this.activeCampaignJobs.has(campaignId.toString())) {
      clearInterval(this.activeCampaignJobs.get(campaignId.toString()));
      this.activeCampaignJobs.delete(campaignId.toString());
    }

    emitCampaignProgress(campaignId, { status: 'Stopped' });
    return campaign;
  }

  /**
   * Dialer Loop: processes batch of leads under concurrency limit
   */
  async processCampaignLeads(campaignId) {
    const campaign = await Campaign.findById(campaignId).populate('agent leads');
    if (!campaign || campaign.status !== 'Running') return;

    // Check calling hours compliance
    if (!this.isWithinCallingHours(campaign)) {
      console.log(`[Compliance] Outside calling hours for campaign ${campaign.name}. Pausing dialer.`);
      emitNotification({
        type: 'warning',
        title: 'Calling Hours Restricted',
        message: `Campaign "${campaign.name}" paused because current time is outside allowed calling hours (${campaign.callingHoursStart} - ${campaign.callingHoursEnd}).`
      });
      return;
    }

    // Filter eligible leads:
    // 1. Not DNC suppressed
    // 2. Consent granted
    // 3. Not currently in an active call
    // 4. Attempts count < maxAttempts
    const eligibleLeads = campaign.leads.filter((lead) => {
      if (lead.isDNC) return false;
      if (!lead.consentStatus) return false;
      if (lead.attemptsCount >= campaign.maxAttempts) return false;
      if (lead.status === 'Completed' && lead.lastCallOutcome === 'Interested') return false;
      return true;
    });

    const activeCallsCount = await Call.countDocuments({
      campaign: campaignId,
      status: { $in: ['initiating', 'ringing', 'connected', 'in-progress'] }
    });

    const availableSlots = Math.max(0, (campaign.concurrencyLimit || 5) - activeCallsCount);

    if (availableSlots <= 0 || eligibleLeads.length === 0) {
      // Check if all leads processed
      const pendingCount = eligibleLeads.length;
      campaign.stats.pendingLeads = pendingCount;
      if (pendingCount === 0 && activeCallsCount === 0) {
        campaign.status = 'Completed';
        campaign.completedAt = new Date();
        await campaign.save();
        emitCampaignProgress(campaignId, { status: 'Completed', stats: campaign.stats });
      }
      return;
    }

    const leadsToDial = eligibleLeads.slice(0, availableSlots);

    for (const lead of leadsToDial) {
      await this.initiateSingleCall({
        campaignId,
        leadId: lead._id,
        agentId: campaign.agent._id
      });
    }
  }

  /**
   * Initiates a single outbound call to a lead
   */
  async initiateSingleCall({ campaignId, leadId, agentId, isManualTest = false }) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    if (lead.isDNC) {
      throw new Error(`Cannot call ${lead.name}: Phone number is on the Do Not Call (DNC) list.`);
    }

    const campaign = campaignId ? await Campaign.findById(campaignId).populate('agent') : null;
    const agent = campaign?.agent || (await (await import('../models/AIAgent.js')).default.findById(agentId));

    if (!agent) throw new Error('AI Agent not found');

    // 1. Create Call Document
    const call = new Call({
      campaign: campaignId || null,
      lead: lead._id,
      agent: agent._id,
      phoneNumber: lead.phoneNumber,
      direction: 'outbound',
      status: 'initiating',
      outcome: 'Pending',
      startTime: new Date()
    });
    await call.save();

    // 2. Update Lead state
    lead.status = 'In Campaign';
    lead.attemptsCount += 1;
    lead.lastCallDate = new Date();
    lead.lastCallStatus = 'Calling';
    await lead.save();

    // 3. Initiate with Vobiz Telephony
    const vobizResult = await vobizAdapter.initiateCall({
      to: lead.phoneNumber,
      statusCallbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/vobiz`,
      metadata: { callId: call._id.toString(), leadId: lead._id.toString() }
    });

    call.providerCallId = vobizResult.callId;
    call.telephonyProvider = vobizResult.isSimulated ? 'simulator' : 'vobiz';

    if (!vobizResult.success) {
      call.status = 'failed';
      call.outcome = 'Failed';
      call.errorReason = vobizResult.error || 'Carrier initiation error';
      await call.save();

      lead.status = 'Unreachable';
      lead.lastCallStatus = 'Failed';
      await lead.save();

      emitLiveCallUpdate(call);
      return call;
    }

    call.status = 'ringing';
    await call.save();
    emitLiveCallUpdate(call);

    // If simulated or test mode, run interactive call simulation progression
    if (vobizResult.isSimulated || isManualTest) {
      this.runRealisticCallSimulation(call._id, agent, lead);
    }

    return call;
  }

  /**
   * Realistic call simulation progression for interactive testing and demonstration
   */
  async runRealisticCallSimulation(callId, agent, lead) {
    try {
      // Step 1: Ringing (2 seconds)
      setTimeout(async () => {
        const call = await Call.findById(callId);
        if (!call || call.status === 'completed' || call.status === 'failed') return;

        call.status = 'connected';
        call.answerTime = new Date();
        await call.save();
        emitLiveCallUpdate(call);

        // Step 2: In Conversation (Agent Greets)
        setTimeout(async () => {
          const call2 = await Call.findById(callId);
          if (!call2 || call2.status === 'completed') return;

          call2.status = 'in-progress';
          await call2.save();
          emitLiveCallUpdate(call2);

          // Create initial transcript greeting
          const greeting = await conversationalVoiceAgent.generateGreeting({ agent, lead });
          let transcriptDoc = await CallTranscript.findOne({ call: callId });
          if (!transcriptDoc) {
            transcriptDoc = new CallTranscript({ call: callId, messages: [] });
          }
          transcriptDoc.messages.push({
            speaker: 'ai',
            text: greeting.text,
            timestamp: new Date(),
            audioUrl: greeting.audioUrl
          });
          await transcriptDoc.save();

          // Step 3: Lead answers back with positive inquiry
          setTimeout(async () => {
            const call3 = await Call.findById(callId);
            if (!call3 || call3.status === 'completed') return;

            const leadQuery = 'Yes, speaking. Can you tell me more about how your solution works and what the pricing looks like?';
            await conversationalVoiceAgent.processCallerUtterance({
              callId,
              callerText: leadQuery,
              durationSeconds: 28
            });

            // Step 4: After engaging dialogue, complete call and synthesize analytics
            setTimeout(async () => {
              const call4 = await Call.findById(callId);
              if (!call4 || call4.status === 'completed') return;

              // Lead confirms interest
              await conversationalVoiceAgent.processCallerUtterance({
                callId,
                callerText: 'Sounds very promising! Please send me the brochure and have someone schedule a short demo with our team.',
                durationSeconds: 65
              });

              // Finalize
              await conversationalVoiceAgent.finalizeCall(callId);
            }, 8000);
          }, 6000);
        }, 3000);
      }, 2500);
    } catch (err) {
      console.error('Call simulation error:', err.message);
    }
  }

  /**
   * Hang up an active call safely
   */
  async hangupCall(callId) {
    const call = await Call.findById(callId);
    if (!call) throw new Error('Call not found');

    if (call.providerCallId) {
      await vobizAdapter.hangupCall(call.providerCallId);
    }

    call.status = 'completed';
    call.endTime = new Date();
    await call.save();

    await conversationalVoiceAgent.finalizeCall(callId);

    emitLiveCallUpdate(call);
    return call;
  }
}

export const callExecutionService = new CallExecutionService();
export default callExecutionService;
