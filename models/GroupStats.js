const mongoose = require('mongoose');

const groupStatsSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    unique: true
  },
  periodType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    default: 'all-time'
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  memberStats: {
    totalActiveMembers: {
      type: Number,
      default: 0
    },
    averageStudyHours: {
      type: Number,
      default: 0
    },
    totalStudyHours: {
      type: Number,
      default: 0
    },
    averageStreak: {
      type: Number,
      default: 0
    },
    longestGroupStreak: {
      type: Number,
      default: 0
    },
    totalGoalsCompleted: {
      type: Number,
      default: 0
    }
  },
  subjectStats: [{
    subject: {
      type: String,
      required: true
    },
    totalHours: {
      type: Number,
      default: 0
    },
    memberCount: {
      type: Number,
      default: 0
    },
    averageProductivity: {
      type: Number,
      default: 0
    },
    popularityRank: {
      type: Number,
      default: 0
    }
  }],
  activityStats: {
    totalStudySessions: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    totalResourcesShared: {
      type: Number,
      default: 0
    },
    totalPartnerships: {
      type: Number,
      default: 0
    },
    activeChallenges: {
      type: Number,
      default: 0
    }
  },
  leaderboardData: {
    topStudyHours: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      hours: {
        type: Number,
        default: 0
      },
      rank: {
        type: Number,
        default: 0
      }
    }],
    topStreak: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      streak: {
        type: Number,
        default: 0
      },
      rank: {
        type: Number,
        default: 0
      }
    }],
    topProductivity: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      productivity: {
        type: Number,
        default: 0
      },
      rank: {
        type: Number,
        default: 0
      }
    }],
    topGoalsCompleted: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      goalsCompleted: {
        type: Number,
        default: 0
      },
      rank: {
        type: Number,
        default: 0
      }
    }]
  },
  comparisonMetrics: {
    percentileRanks: {
      studyHours: {
        p25: Number,
        p50: Number,
        p75: Number,
        p90: Number
      },
      streak: {
        p25: Number,
        p50: Number,
        p75: Number,
        p90: Number
      },
      productivity: {
        p25: Number,
        p50: Number,
        p75: Number,
        p90: Number
      }
    },
    distributionData: {
      studyHoursDistribution: [{
        range: String, // e.g., "0-2", "2-4", "4-6", "6+"
        count: Number,
        percentage: Number
      }],
      streakDistribution: [{
        range: String, // e.g., "0-7", "8-14", "15-30", "30+"
        count: Number,
        percentage: Number
      }]
    }
  },
  trends: {
    weekOverWeekGrowth: {
      studyHours: {
        type: Number,
        default: 0
      },
      activeMembers: {
        type: Number,
        default: 0
      },
      averageProductivity: {
        type: Number,
        default: 0
      }
    },
    peakActivityTimes: [{
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      activityCount: {
        type: Number,
        default: 0
      },
      averageDuration: {
        type: Number,
        default: 0
      }
    }],
    popularStudyDays: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6 // 0 = Sunday, 6 = Saturday
      },
      activityCount: {
        type: Number,
        default: 0
      },
      averageHours: {
        type: Number,
        default: 0
      }
    }]
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
groupStatsSchema.index({ group: 1, periodType: 1 });
groupStatsSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
groupStatsSchema.index({ lastCalculated: 1 });

// Static method to get or create stats for a group
groupStatsSchema.statics.getGroupStats = async function(groupId, periodType = 'all-time') {
  let stats = await this.findOne({ group: groupId, periodType });
  
  if (!stats) {
    const now = new Date();
    let startDate, endDate;
    
    switch (periodType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default: // all-time
        startDate = new Date('2020-01-01');
        endDate = new Date('2030-12-31');
    }
    
    stats = await this.create({
      group: groupId,
      periodType,
      dateRange: { startDate, endDate }
    });
  }
  
  return stats;
};

// Static method to calculate and update group statistics
groupStatsSchema.statics.calculateGroupStats = async function(groupId, periodType = 'all-time') {
  const StudySession = mongoose.model('StudySession');
  const StudyGroup = mongoose.model('StudyGroup');
  const User = mongoose.model('User');
  const GroupActivity = mongoose.model('GroupActivity');
  
  const stats = await this.getGroupStats(groupId, periodType);
  const { startDate, endDate } = stats.dateRange;
  
  // Get group members
  const group = await StudyGroup.findById(groupId).populate('members.user');
  if (!group) return null;
  
  const activeMembers = group.members.filter(member => member.isActive);
  const memberIds = activeMembers.map(member => member.user._id);
  
  // Calculate member stats
  const studySessions = await StudySession.find({
    user: { $in: memberIds },
    startTime: { $gte: startDate, $lte: endDate }
  });
  
  const totalStudyHours = studySessions.reduce((sum, session) => sum + (session.duration / 60), 0);
  const averageStudyHours = activeMembers.length > 0 ? totalStudyHours / activeMembers.length : 0;
  
  // Calculate subject statistics
  const subjectData = {};
  studySessions.forEach(session => {
    if (!subjectData[session.subject]) {
      subjectData[session.subject] = {
        totalHours: 0,
        sessionCount: 0,
        memberSet: new Set(),
        totalProductivity: 0
      };
    }
    
    subjectData[session.subject].totalHours += session.duration / 60;
    subjectData[session.subject].sessionCount += 1;
    subjectData[session.subject].memberSet.add(session.user.toString());
    subjectData[session.subject].totalProductivity += session.productivity;
  });
  
  const subjectStats = Object.entries(subjectData)
    .map(([subject, data], index) => ({
      subject,
      totalHours: Math.round(data.totalHours * 100) / 100,
      memberCount: data.memberSet.size,
      averageProductivity: data.sessionCount > 0 ? 
        Math.round((data.totalProductivity / data.sessionCount) * 100) / 100 : 0,
      popularityRank: index + 1
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .map((item, index) => ({ ...item, popularityRank: index + 1 }));
  
  // Calculate user rankings for leaderboards
  const userStats = {};
  
  // Initialize user stats
  memberIds.forEach(userId => {
    userStats[userId] = {
      userId,
      studyHours: 0,
      streak: 0,
      productivity: 0,
      goalsCompleted: 0,
      sessionCount: 0
    };
  });
  
  // Aggregate study sessions data
  studySessions.forEach(session => {
    const userStat = userStats[session.user];
    if (userStat) {
      userStat.studyHours += session.duration / 60;
      userStat.productivity += session.productivity;
      userStat.sessionCount += 1;
    }
  });
  
  // Calculate average productivity and get user data
  const userStatsArray = await Promise.all(
    Object.values(userStats).map(async (stat) => {
      const user = await User.findById(stat.userId);
      return {
        ...stat,
        productivity: stat.sessionCount > 0 ? stat.productivity / stat.sessionCount : 0,
        streak: user?.progressStats?.currentStreak || 0,
        studyHours: Math.round(stat.studyHours * 100) / 100
      };
    })
  );
  
  // Create leaderboards (top 10 each)
  const topStudyHours = userStatsArray
    .sort((a, b) => b.studyHours - a.studyHours)
    .slice(0, 10)
    .map((stat, index) => ({
      user: stat.userId,
      hours: stat.studyHours,
      rank: index + 1
    }));
  
  const topStreak = userStatsArray
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10)
    .map((stat, index) => ({
      user: stat.userId,
      streak: stat.streak,
      rank: index + 1
    }));
  
  const topProductivity = userStatsArray
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 10)
    .map((stat, index) => ({
      user: stat.userId,
      productivity: Math.round(stat.productivity * 100) / 100,
      rank: index + 1
    }));
  
  // Calculate percentiles
  const studyHoursValues = userStatsArray.map(u => u.studyHours).sort((a, b) => a - b);
  const streakValues = userStatsArray.map(u => u.streak).sort((a, b) => a - b);
  const productivityValues = userStatsArray.map(u => u.productivity).sort((a, b) => a - b);
  
  const calculatePercentile = (values, percentile) => {
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)] || 0;
  };
  
  // Update stats document
  stats.memberStats = {
    totalActiveMembers: activeMembers.length,
    averageStudyHours: Math.round(averageStudyHours * 100) / 100,
    totalStudyHours: Math.round(totalStudyHours * 100) / 100,
    averageStreak: userStatsArray.length > 0 ? 
      Math.round((userStatsArray.reduce((sum, u) => sum + u.streak, 0) / userStatsArray.length) * 100) / 100 : 0,
    longestGroupStreak: Math.max(...userStatsArray.map(u => u.streak), 0),
    totalGoalsCompleted: userStatsArray.reduce((sum, u) => sum + u.goalsCompleted, 0)
  };
  
  stats.subjectStats = subjectStats;
  
  stats.activityStats = {
    totalStudySessions: studySessions.length,
    averageSessionDuration: studySessions.length > 0 ? 
      Math.round((studySessions.reduce((sum, s) => sum + s.duration, 0) / studySessions.length) * 100) / 100 : 0,
    totalResourcesShared: 0, // Will be calculated when resource sharing is implemented
    totalPartnerships: 0, // Will be calculated when partnerships are implemented
    activeChallenges: 0 // Will be calculated when challenges are implemented
  };
  
  stats.leaderboardData = {
    topStudyHours,
    topStreak,
    topProductivity,
    topGoalsCompleted: [] // Will be calculated when goal tracking is enhanced
  };
  
  stats.comparisonMetrics = {
    percentileRanks: {
      studyHours: {
        p25: calculatePercentile(studyHoursValues, 25),
        p50: calculatePercentile(studyHoursValues, 50),
        p75: calculatePercentile(studyHoursValues, 75),
        p90: calculatePercentile(studyHoursValues, 90)
      },
      streak: {
        p25: calculatePercentile(streakValues, 25),
        p50: calculatePercentile(streakValues, 50),
        p75: calculatePercentile(streakValues, 75),
        p90: calculatePercentile(streakValues, 90)
      },
      productivity: {
        p25: Math.round(calculatePercentile(productivityValues, 25) * 100) / 100,
        p50: Math.round(calculatePercentile(productivityValues, 50) * 100) / 100,
        p75: Math.round(calculatePercentile(productivityValues, 75) * 100) / 100,
        p90: Math.round(calculatePercentile(productivityValues, 90) * 100) / 100
      }
    }
  };
  
  stats.lastCalculated = new Date();
  
  await stats.save();
  return stats;
};

// Instance method to check if stats need refresh
groupStatsSchema.methods.needsRefresh = function(maxAgeHours = 1) {
  const now = new Date();
  const ageHours = (now - this.lastCalculated) / (1000 * 60 * 60);
  return ageHours > maxAgeHours;
};

module.exports = mongoose.model('GroupStats', groupStatsSchema);
