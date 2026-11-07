import Call from '../models/Call.js';
import Lead from '../models/Lead.js';
import CallRecording from '../models/CallRecording.js';
import vobizAdapter from '../integrations/vobizAdapter.js';
import livekitAdapter from '../integrations/livekitAdapter.js';
import conversationalVoiceAgent from '../agents/conversationalVoiceAgent.js';
import { emitLiveCallUpdate, emitNotification } from '../config/socket.js';

/**
 * @route   POST /api/webhooks/vobiz
 * @desc    Receives call status and recording callbacks from Vobiz Telephony
 */
export const handleVobizWebhook = async (req, res, next) => {
  try {
    const rawPayload = JSON.stringify(req.body);
    const signature = req.headers['x-vobiz-signature'];

    // Verify signature
    const isValid = vobizAdapter.verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      console.warn('[Security] Rejected Vobiz webhook with invalid HMAC signature.');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const {
      call_id,
      status,
      duration,
      recording_url,
      disconnect_reason,
      metadata = {}
    } = req.body;

    console.log(`📡 Vobiz Webhook: Call ${call_id} -> Status: ${status}`);

    const call = await Call.findOne({
      $or: [{ providerCallId: call_id }, { _id: metadata.callId }]
    }).populate('lead');

    if (!call) {
      return res.status(200).json({ received: true, note: 'Call record not found' });
    }

    // Map Vobiz status to our system status
    const statusMap = {
      initiated: 'initiating',
      ringing: 'ringing',
      answered: 'connected',
      'in-progress': 'in-progress',
      completed: 'completed',
      busy: 'busy',
      failed: 'failed',
      rejected: 'rejected',
      'no-answer': 'no-answer'
    };

    const mappedStatus = statusMap[status] || call.status;
    call.status = mappedStatus;

    if (duration !== undefined) {
      call.duration = Number(duration);
    }

    if (recording_url) {
      call.recordingUrl = recording_url;
      await CallRecording.findOneAndUpdate(
        { call: call._id },
        {
          call: call._id,
          recordingUrl: recording_url,
          duration: call.duration,
          providerCallId: call_id,
          status: 'ready'
        },
        { upsert: true }
      );
    }

    if (status === 'completed') {
      call.endTime = new Date();
      await call.save();
      // Run AI analysis and outcome classification
      await conversationalVoiceAgent.finalizeCall(call._id);
    } else if (status === 'busy' || status === 'no-answer' || status === 'failed') {
      call.outcome = status === 'busy' ? 'Busy' : status === 'no-answer' ? 'No Answer' : 'Failed';
      call.errorReason = disconnect_reason || '';
      call.endTime = new Date();
      await call.save();

      if (call.lead) {
        await Lead.findByIdAndUpdate(call.lead._id, {
          lastCallStatus: call.status,
          lastCallOutcome: call.outcome,
          status: 'Unreachable'
        });
      }
    } else {
      await call.save();
    }

    emitLiveCallUpdate(call);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Vobiz webhook processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route   POST /api/webhooks/livekit
 * @desc    Receives participant events and egress notifications from LiveKit
 */
export const handleLiveKitWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const rawBody = JSON.stringify(req.body);

    const event = livekitAdapter.verifyWebhook(rawBody, authHeader);
    console.log(`📡 LiveKit Webhook received:`, event?.event || req.body?.event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('LiveKit webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
