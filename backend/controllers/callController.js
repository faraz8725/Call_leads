import Call from '../models/Call.js';
import CallTranscript from '../models/CallTranscript.js';
import CallRecording from '../models/CallRecording.js';
import callExecutionService from '../services/callExecutionService.js';

/**
 * @route   GET /api/calls
 * @desc    Get call history with filters and pagination
 */
export const getCalls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { campaignId, outcome, status, search, handoff } = req.query;

    const query = {};

    if (campaignId) query.campaign = campaignId;
    if (outcome && outcome !== 'All') query.outcome = outcome;
    if (status && status !== 'All') query.status = status;
    if (handoff === 'true') query.humanHandoffRequired = true;

    if (search) {
      query.phoneNumber = { $regex: search, $options: 'i' };
    }

    const total = await Call.countDocuments(query);
    const calls = await Call.find(query)
      .populate('lead', 'name phoneNumber company location')
      .populate('agent', 'name language voiceId')
      .populate('campaign', 'name')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/calls/live
 * @desc    Get all currently active live calls
 */
export const getLiveCalls = async (req, res, next) => {
  try {
    const liveCalls = await Call.find({
      status: { $in: ['initiating', 'ringing', 'connected', 'in-progress'] }
    })
      .populate('lead', 'name phoneNumber company')
      .populate('agent', 'name language voiceId')
      .populate('campaign', 'name')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: liveCalls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/calls/:id
 * @desc    Get detailed call view including full transcript & recording
 */
export const getCallById = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('lead')
      .populate('agent')
      .populate('campaign');

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    const transcript = await CallTranscript.findOne({ call: call._id });
    const recording = await CallRecording.findOne({ call: call._id });

    res.status(200).json({
      success: true,
      data: {
        call,
        transcript: transcript || { messages: [], summary: '', keyTakeaways: [], actionItems: [] },
        recording: recording || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/calls/initiate
 * @desc    Initiate a test or manual call to a lead
 */
export const initiateCall = async (req, res, next) => {
  try {
    const { leadId, agentId, campaignId } = req.body;

    if (!leadId || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'leadId and agentId are required to initiate call.'
      });
    }

    const call = await callExecutionService.initiateSingleCall({
      campaignId,
      leadId,
      agentId,
      isManualTest: true
    });

    res.status(201).json({
      success: true,
      message: 'Call initiated successfully',
      data: call
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/calls/:id/hangup
 * @desc    Hang up an ongoing call
 */
export const hangupCall = async (req, res, next) => {
  try {
    const call = await callExecutionService.hangupCall(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Call terminated successfully',
      data: call
    });
  } catch (error) {
    next(error);
  }
};
