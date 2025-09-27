import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";

interface PremiumAnalyticsProps {
  analytics: any;
  userId: string;
  tier?: string | null;
}

export function PremiumAnalytics({ analytics, userId, tier }: PremiumAnalyticsProps) {
  // Default analytics data structure
  const defaultAnalytics = {
    learningVelocity: {
      current: 85,
      trend: "up",
      change: 12
    },
    skillProgression: [
      { skill: "JavaScript", level: 85, target: 90 },
      { skill: "React", level: 78, target: 85 },
      { skill: "Node.js", level: 72, target: 80 },
      { skill: "TypeScript", level: 65, target: 75 }
    ],
    weeklyStats: {
      hoursLearned: 12.5,
      coursesCompleted: 2,
      averageScore: 88,
      streak: 7
    },
    peerComparison: {
      rank: 15,
      percentile: 85,
      totalLearners: 1247
    },
    predictions: {
      nextCertification: "15 days",
      skillMastery: "JavaScript in 3 weeks",
      completionRate: 94
    }
  };

  const data = analytics || defaultAnalytics;

  return (
    <div className="space-y-6" data-testid="premium-analytics">
      {/* Learning Velocity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EnhancedIcon name="Zap" size={20} />
              <span>Learning Velocity</span>
            </div>
            <Badge variant="secondary">Premium Analytics</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {data.learningVelocity.current}%
              </div>
              <p className="text-sm text-muted-foreground">Current Velocity</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <EnhancedIcon 
                  name={data.learningVelocity.trend === "up" ? "TrendingUp" : "TrendingDown"} 
                  size={16} 
                  className={data.learningVelocity.trend === "up" ? "text-green-500" : "text-red-500"} 
                />
                <span className={`text-2xl font-bold ${data.learningVelocity.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {data.learningVelocity.change}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Weekly Change</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {data.weeklyStats.streak}
              </div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Progression Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <EnhancedIcon name="Target" size={20} />
            <span>Skill Progression Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.skillProgression.map((skill: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {skill.level}% / {skill.target}%
                    </span>
                    <Badge 
                      variant={skill.level >= skill.target ? "default" : "secondary"}
                      size="sm"
                    >
                      {skill.level >= skill.target ? "Achieved" : "In Progress"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={skill.level} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {skill.level}%</span>
                    <span>Target: {skill.target}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <EnhancedIcon name="CalendarDays" size={20} />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EnhancedIcon name="Clock" size={16} className="text-blue-500" />
                  <span className="text-sm">Learning Hours</span>
                </div>
                <span className="font-bold">{data.weeklyStats.hoursLearned}h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EnhancedIcon name="BookOpen" size={16} className="text-green-500" />
                  <span className="text-sm">Courses Completed</span>
                </div>
                <span className="font-bold">{data.weeklyStats.coursesCompleted}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EnhancedIcon name="Star" size={16} className="text-yellow-500" />
                  <span className="text-sm">Average Score</span>
                </div>
                <span className="font-bold">{data.weeklyStats.averageScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peer Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <EnhancedIcon name="Users" size={20} />
              <span>Peer Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  #{data.peerComparison.rank}
                </div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {data.peerComparison.percentile}th
                </div>
                <p className="text-sm text-muted-foreground">Percentile</p>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Among {data.peerComparison.totalLearners.toLocaleString()} learners
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <EnhancedIcon name="Brain" size={20} />
            <span>AI Predictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <EnhancedIcon name="Award" size={24} className="text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-sm">Next Certification</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.predictions.nextCertification}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <EnhancedIcon name="Target" size={24} className="text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="font-medium text-sm">Skill Mastery</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.predictions.skillMastery}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <EnhancedIcon name="TrendingUp" size={24} className="text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-sm">Completion Rate</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {data.predictions.completionRate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}