import Lead from '../models/Lead.js';
import Call from '../models/Call.js';
import Campaign from '../models/Campaign.js';
import AIAgent from '../models/AIAgent.js';

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Comprehensive metrics for SaaS dashboard
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const dncLeads = await Lead.countDocuments({ isDNC: true });

    const totalCalls = await Call.countDocuments();
    const successfulCalls = await Call.countDocuments({
      outcome: { $in: ['Interested', 'Callback Requested', 'Completed', 'Human Handoff Requested'] }
    });
    const failedCalls = await Call.countDocuments({
      outcome: { $in: ['Failed', 'Busy'] }
    });
    const answeredCalls = await Call.countDocuments({
      outcome: { $nin: ['No Answer', 'Failed', 'Pending'] }
    });
    const noAnswerCalls = await Call.countDocuments({ outcome: 'No Answer' });

    const interestedLeads = await Call.countDocuments({ outcome: 'Interested' });
    const notInterestedLeads = await Call.countDocuments({ outcome: 'Not Interested' });
    const callbackRequested = await Call.countDocuments({ outcome: 'Callback Requested' });
    const humanHandoffRequired = await Call.countDocuments({ humanHandoffRequired: true });

    // Aggregations for total duration and average duration
    const durationStats = await Call.aggregate([
      { $match: { duration: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const totalDurationSeconds = durationStats[0]?.totalDuration || 0;
    const avgDurationSeconds = Math.round(durationStats[0]?.avgDuration || 0);

    const callSuccessRate =
      totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;
    const interestedPercentage =
      totalCalls > 0 ? Math.round((interestedLeads / totalCalls) * 100) : 0;

    // Call Volume Breakdown by Outcome for Pie Chart
    const outcomeBreakdown = [
      { name: 'Interested', value: interestedLeads, color: '#10b981' },
      { name: 'Not Interested', value: notInterestedLeads, color: '#ef4444' },
      { name: 'Callback Requested', value: callbackRequested, color: '#f59e0b' },
      { name: 'Human Handoff', value: humanHandoffRequired, color: '#8b5cf6' },
      { name: 'No Answer', value: noAnswerCalls, color: '#64748b' },
      { name: 'Failed / Busy', value: failedCalls, color: '#f43f5e' }
    ];

    // 7-day Call Volume and Success trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrends = await Call.aggregate([
      { $match: { startTime: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          total: { $sum: 1 },
          interested: {
            $sum: { $cond: [{ $eq: ['$outcome', 'Interested'] }, 1, 0] }
          },
          answered: {
            $sum: {
              $cond: [{ $in: ['$status', ['connected', 'in-progress', 'completed']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Active campaigns count
    const activeCampaigns = await Campaign.countDocuments({ status: 'Running' });
    const totalCampaigns = await Campaign.countDocuments();

    // Recent calls
    const recentCalls = await Call.find()
      .populate('lead', 'name phoneNumber company')
      .populate('agent', 'name')
      .populate('campaign', 'name')
      .sort({ startTime: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalLeads,
          dncLeads,
          totalCalls,
          successfulCalls,
          failedCalls,
          answeredCalls,
          noAnswerCalls,
          interestedLeads,
          notInterestedLeads,
          callbackRequested,
          humanHandoffRequired,
          totalDurationSeconds,
          avgDurationSeconds,
          callSuccessRate,
          interestedPercentage,
          activeCampaigns,
          totalCampaigns
        },
        outcomeBreakdown,
        dailyTrends,
        recentCalls
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/campaigns
 * @desc    Campaign-wise comparative metrics & agent performance
 */
export const getCampaignAnalytics = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find()
      .populate('agent', 'name language')
      .sort({ createdAt: -1 });

    const campaignPerformance = await Promise.all(
      campaigns.map(async (camp) => {
        const calls = await Call.find({ campaign: camp._id });
        const total = calls.length;
        const interested = calls.filter((c) => c.outcome === 'Interested').length;
        const handedOff = calls.filter((c) => c.humanHandoffRequired).length;
        const duration = calls.reduce((acc, c) => acc + (c.duration || 0), 0);

        return {
          id: camp._id,
          name: camp.name,
          agentName: camp.agent?.name || 'N/A',
          status: camp.status,
          totalCalls: total,
          interested,
          interestRate: total > 0 ? Math.round((interested / total) * 100) : 0,
          handedOff,
          totalDuration: duration,
          avgDuration: total > 0 ? Math.round(duration / total) : 0
        };
      })
    );

    // Agent performance breakdown
    const agentStats = await Call.aggregate([
      {
        $group: {
          _id: '$agent',
          callsCount: { $sum: 1 },
          interestedCount: {
            $sum: { $cond: [{ $eq: ['$outcome', 'Interested'] }, 1, 0] }
          },
          avgScore: { $avg: '$interestScore' },
          totalSeconds: { $sum: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'aiagents',
          localField: '_id',
          foreignField: '_id',
          as: 'agentInfo'
        }
      },
      { $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        campaignPerformance,
        agentStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/export
 * @desc    Export call logs to CSV format
 */
export const exportAnalytics = async (req, res, next) => {
  try {
    const calls = await Call.find()
      .populate('lead', 'name phoneNumber email company')
      .populate('agent', 'name')
      .populate('campaign', 'name')
      .sort({ startTime: -1 })
      .limit(1000);

    const headers = [
      'Call ID',
      'Date & Time',
      'Lead Name',
      'Phone Number',
      'Company',
      'Campaign',
      'AI Agent',
      'Status',
      'Outcome',
      'Interest Score',
      'Duration (sec)',
      'Sentiment',
      'Human Handoff'
    ];

    const rows = calls.map((c) => [
      c._id.toString(),
      c.startTime ? new Date(c.startTime).toISOString() : '',
      `"${c.lead?.name || 'Unknown'}"`,
      `"${c.phoneNumber}"`,
      `"${c.lead?.company || 'N/A'}"`,
      `"${c.campaign?.name || 'Manual'}"`,
      `"${c.agent?.name || 'Default'}"`,
      c.status,
      c.outcome,
      c.interestScore,
      c.duration,
      c.sentiment,
      c.humanHandoffRequired ? 'YES' : 'NO'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="call_analytics_report_${Date.now()}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
