import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';
import ActivityLog from '../models/ActivityLog.js';
import leadImportService from '../services/leadImportService.js';

/**
 * @route   GET /api/leads
 * @desc    Get all leads with search, filtering, and pagination
 */
export const getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { search, status, outcome, isDNC, campaignId } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (outcome && outcome !== 'All') {
      query.lastCallOutcome = outcome;
    }

    if (isDNC !== undefined && isDNC !== '') {
      query.isDNC = isDNC === 'true';
    }

    if (campaignId) {
      query.campaigns = campaignId;
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('campaigns', 'name status');

    res.status(200).json({
      success: true,
      data: leads,
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
 * @route   GET /api/leads/:id
 * @desc    Get single lead by ID
 */
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('campaigns', 'name status');
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads
 * @desc    Create lead manually
 */
export const createLead = async (req, res, next) => {
  try {
    const { name, phoneNumber, email, company, location, notes, customFields, consentStatus } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and Phone Number are required fields.'
      });
    }

    const phoneValidation = leadImportService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.reason
      });
    }

    // Check duplicate
    const existing = await Lead.findOne({ phoneNumber: phoneValidation.normalized });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A lead with phone number ${phoneValidation.normalized} already exists (${existing.name}).`
      });
    }

    const lead = await Lead.create({
      name: name.trim(),
      phoneNumber: phoneValidation.normalized,
      email: email ? email.trim() : '',
      company: company ? company.trim() : '',
      location: location ? location.trim() : '',
      notes: notes || '',
      customFields: customFields || {},
      consentStatus: consentStatus !== false,
      consentDate: new Date(),
      consentSource: 'Admin Manual Entry',
      createdBy: req.admin?._id
    });

    await ActivityLog.create({
      admin: req.admin?._id,
      action: 'CREATE_LEAD',
      entityType: 'Lead',
      entityId: lead._id.toString(),
      description: `Added lead: ${lead.name} (${lead.phoneNumber})`
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/leads/:id
 * @desc    Update lead details
 */
export const updateLead = async (req, res, next) => {
  try {
    const { name, phoneNumber, email, company, location, notes, isDNC, consentStatus, customFields } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (name) lead.name = name.trim();
    if (email !== undefined) lead.email = email.trim();
    if (company !== undefined) lead.company = company.trim();
    if (location !== undefined) lead.location = location.trim();
    if (notes !== undefined) lead.notes = notes;
    if (isDNC !== undefined) lead.isDNC = isDNC;
    if (consentStatus !== undefined) lead.consentStatus = consentStatus;
    if (customFields) lead.customFields = customFields;

    if (phoneNumber && phoneNumber !== lead.phoneNumber) {
      const phoneValidation = leadImportService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ success: false, message: phoneValidation.reason });
      }
      lead.phoneNumber = phoneValidation.normalized;
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete lead
 */
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Pull from campaigns
    await Campaign.updateMany({ leads: lead._id }, { $pull: { leads: lead._id } });

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads/bulk-delete
 * @desc    Bulk delete leads
 */
export const bulkDeleteLeads = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide lead IDs to delete' });
    }

    await Lead.deleteMany({ _id: { $in: ids } });
    await Campaign.updateMany({}, { $pull: { leads: { $in: ids } } });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${ids.length} leads`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads/:id/toggle-dnc
 * @desc    Toggle Do Not Call suppression status
 */
export const toggleDNC = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    lead.isDNC = !lead.isDNC;
    if (lead.isDNC) {
      lead.status = 'Unreachable';
    }
    await lead.save();

    res.status(200).json({
      success: true,
      message: `Lead ${lead.name} is now ${lead.isDNC ? 'marked as DNC (Do Not Call)' : 'cleared from DNC list'}`,
      isDNC: lead.isDNC
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads/preview-import
 * @desc    Upload Excel / CSV file, parse and return preview validation summary
 */
export const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded' });
    }

    const previewResult = await leadImportService.previewAndValidate(req.file.buffer);

    res.status(200).json({
      success: true,
      preview: previewResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads/commit-import
 * @desc    Commit validated rows to MongoDB
 */
export const commitImport = async (req, res, next) => {
  try {
    const { leads, skipDuplicates = true } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No lead rows provided to import'
      });
    }

    const result = await leadImportService.commitImport(leads, req.admin?._id, skipDuplicates);

    await ActivityLog.create({
      admin: req.admin?._id,
      action: 'IMPORT_LEADS',
      entityType: 'Lead',
      description: `Imported ${result.insertedCount} leads from spreadsheet (${result.skippedCount} duplicates skipped)`
    });

    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.insertedCount} leads (${result.skippedCount} duplicates skipped)`,
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/leads/add-to-campaign
 * @desc    Bulk assign leads to a calling campaign
 */
export const addLeadsToCampaign = async (req, res, next) => {
  try {
    const { leadIds, campaignId } = req.body;

    if (!leadIds || !campaignId) {
      return res.status(400).json({
        success: false,
        message: 'leadIds and campaignId are required'
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Add unique lead IDs to campaign
    const existingIds = new Set(campaign.leads.map((id) => id.toString()));
    const toAdd = leadIds.filter((id) => !existingIds.has(id));

    campaign.leads.push(...toAdd);
    campaign.stats.totalLeads = campaign.leads.length;
    await campaign.save();

    // Update leads with campaign ref
    await Lead.updateMany(
      { _id: { $in: toAdd } },
      { $addToSet: { campaigns: campaignId } }
    );

    res.status(200).json({
      success: true,
      message: `Added ${toAdd.length} leads to campaign "${campaign.name}"`,
      totalCampaignLeads: campaign.leads.length
    });
  } catch (error) {
    next(error);
  }
};
