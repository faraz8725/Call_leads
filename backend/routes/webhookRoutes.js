import express from 'express';
import {
  handleVobizWebhook,
  handleLiveKitWebhook
} from '../controllers/webhookController.js';

const router = express.Router();

// Webhooks are publicly reachable by the telephony/RTC providers
router.post('/vobiz', handleVobizWebhook);
router.post('/livekit', handleLiveKitWebhook);

export default router;
