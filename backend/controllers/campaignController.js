import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import Call from '../models/Call.js';
import ActivityLog from '../models/ActivityLog.js';
import callExecutionService from '../services/callExecutionService.js';

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns with populated references and live statistics
 */
export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find()
      .populate('agent', 'name language voiceId speakingStyle')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get single campaign by ID with associated leads and call metrics
 */
export const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('agent')
      .populate({
        path: 'leads',
        select: 'name phoneNumber email company status isDNC lastCallOutcome interestScore attemptsCount'
      });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Compute live count aggregations
    const callStats = await Call.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: campaign,
      callStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/campaigns
 * @desc    Create new campaign (Wizard submission)
 */
export const createCampaign = async (req, res, next) => {
  try {
    const {
      name,
      description,
      agent,
      leads = [],
      script,
      language = 'en',
      voiceId = 'meera',
      timezone = 'Asia/Kolkata',
      callingHoursStart = '09:00',
      callingHoursEnd = '19:00',
      maxAttempts = 3,
      retryIntervalMinutes = 60,
      concurrencyLimit = 5,
      scheduledAt
    } = req.body;

    if (!name || !agent) {
      return res.status(400).json({
        success: false,
        message: 'Campaign Name and AI Agent are required'
      });
    }

    const campaign = await Campaign.create({
      name: name.trim(),
      description: description || '',
      agent,
      leads,
      script: script || 'Standard qualifying sales script.',
      language,
      voiceId,
      timezone,
      callingHoursStart,
      callingHoursEnd,
      maxAttempts,
      retryIntervalMinutes,
      concurrencyLimit,
      status: scheduledAt ? 'Scheduled' : 'Draft',
      scheduledAt: scheduledAt || null,
      stats: {
        totalLeads: leads.length,
        pendingLeads: leads.length
      },
      createdBy: req.admin?._id
    });

    if (leads.length > 0) {
      await Lead.updateMany(
        { _id: { $in: leads } },
        { $addToSet: { campaigns: campaign._id } }
      );
    }

    await ActivityLog.create({
      admin: req.admin?._id,
      action: 'CREATE_CAMPAIGN',
      entityType: 'Campaign',
      entityId: campaign._id.toString(),
      description: `Created campaign "${campaign.name}" with ${leads.length} leads assigned.`
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign settings
 */
export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const fields = [
      'name',
      'description',
      'agent',
      'script',
      'language',
      'voiceId',
      'timezone',
      'callingHoursStart',
      'callingHoursEnd',
      'maxAttempts',
      'retryIntervalMinutes',
      'concurrencyLimit'
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        campaign[f] = req.body[f];
      }
    });

    if (req.body.leads) {
      campaign.leads = req.body.leads;
      campaign.stats.totalLeads = req.body.leads.length;
    }

    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign
 */
export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.status === 'Running') {
      await callExecutionService.stopCampaign(campaign._id);
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/campaigns/:id/start
 * @desc    Start/Launch campaign dialer
 */
export const startCampaign = async (req, res, next) => {
  try {
    const campaign = await callExecutionService.startCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: `Campaign "${campaign.name}" started successfully`,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/campaigns/:id/pause
 * @desc    Pause campaign dialer
 */
export const pauseCampaign = async (req, res, next) => {
  try {
    const campaign = await callExecutionService.pauseCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: `Campaign "${campaign.name}" paused`,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/campaigns/:id/resume
 * @desc    Resume paused campaign
 */
export const resumeCampaign = async (req, res, next) => {
  try {
    const campaign = await callExecutionService.startCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: `Campaign "${campaign.name}" resumed`,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/campaigns/:id/stop
 * @desc    Stop campaign completely
 */
export const stopCampaign = async (req, res, next) => {
  try {
    const campaign = await callExecutionService.stopCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: `Campaign "${campaign.name}" stopped`,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};
