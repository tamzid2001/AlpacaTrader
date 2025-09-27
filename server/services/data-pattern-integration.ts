import { IStorage } from '../storage';
import { AutomationEngine } from './automation';
import { 
  sendTaskAssignment, 
  sendDueDateReminder,
  formatTimeUntilDue 
} from './email';

// Data Pattern Integration Service for Productivity Management
export class DataPatternIntegrationService {
  private automationEngine: AutomationEngine;

  constructor(private storage: IStorage) {
    this.automationEngine = new AutomationEngine(storage);
  }

  // Create productivity items from anomalies detected in data analysis
  async createItemsFromAnomalies(
    anomalies: AnomalyDetectionResult[],
    userId: string,
    boardId?: string
  ): Promise<string[]> {
    try {
      const createdItemIds: string[] = [];

      // Get or create anomaly detection board
      const board = boardId 
        ? await this.storage.getProductivityBoard(boardId)
        : await this.getOrCreateAnomalyBoard(userId);

      if (!board) {
        throw new Error('Could not find or create anomaly detection board');
      }

      for (const anomaly of anomalies) {
        const item = await this.createAnomalyItem(anomaly, board.id, userId);
        if (item) {
          createdItemIds.push(item);
          
          // Trigger automations for new anomaly items
          await this.automationEngine.processAutomations(board.id, 'item_created', {
            itemId: item,
            userId,
            triggeredBy: 'system'
          });
        }
      }

      return createdItemIds;
    } catch (error) {
      console.error('Error creating items from anomalies:', error);
      throw error;
    }
  }

  // Create productivity items from pattern recognition results
  async createItemsFromPatterns(
    patterns: PatternRecognitionResult[],
    userId: string,
    boardId?: string
  ): Promise<string[]> {
    try {
      const createdItemIds: string[] = [];

      // Get or create pattern analysis board
      const board = boardId 
        ? await this.storage.getProductivityBoard(boardId)
        : await this.getOrCreatePatternBoard(userId);

      if (!board) {
        throw new Error('Could not find or create pattern analysis board');
      }

      for (const pattern of patterns) {
        const items = await this.createPatternItems(pattern, board.id, userId);
        createdItemIds.push(...items);
        
        // Trigger automations for new pattern items
        for (const itemId of items) {
          await this.automationEngine.processAutomations(board.id, 'item_created', {
            itemId,
            userId,
            triggeredBy: 'system'
          });
        }
      }

      return createdItemIds;
    } catch (error) {
      console.error('Error creating items from patterns:', error);
      throw error;
    }
  }

  // Generate AI-suggested task assignments based on data patterns
  async suggestTaskAssignments(
    dataInsights: DataInsight[],
    teamMembers: TeamMember[]
  ): Promise<TaskAssignmentSuggestion[]> {
    try {
      const suggestions: TaskAssignmentSuggestion[] = [];

      for (const insight of dataInsights) {
        const suggestion = await this.generateAssignmentSuggestion(insight, teamMembers);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating task assignment suggestions:', error);
      throw error;
    }
  }

  // Create predictive tasks based on trend analysis
  async createPredictiveTasks(
    trendAnalysis: TrendAnalysisResult[],
    userId: string,
    boardId?: string
  ): Promise<string[]> {
    try {
      const createdItemIds: string[] = [];

      // Get or create predictive analysis board
      const board = boardId 
        ? await this.storage.getProductivityBoard(boardId)
        : await this.getOrCreatePredictiveBoard(userId);

      if (!board) {
        throw new Error('Could not find or create predictive analysis board');
      }

      for (const trend of trendAnalysis) {
        const items = await this.createPredictiveItems(trend, board.id, userId);
        createdItemIds.push(...items);
      }

      return createdItemIds;
    } catch (error) {
      console.error('Error creating predictive tasks:', error);
      throw error;
    }
  }

  // Integration with CSV analysis results
  async processCSVAnalysisResults(
    analysisResults: CSVAnalysisResult,
    userId: string
  ): Promise<{
    anomalyItems: string[];
    patternItems: string[];
    actionItems: string[];
  }> {
    try {
      const result = {
        anomalyItems: [] as string[],
        patternItems: [] as string[],
        actionItems: [] as string[]
      };

      // Process anomalies from CSV analysis
      if (analysisResults.anomalies && analysisResults.anomalies.length > 0) {
        result.anomalyItems = await this.createItemsFromAnomalies(
          analysisResults.anomalies,
          userId
        );
      }

      // Process patterns from CSV analysis
      if (analysisResults.patterns && analysisResults.patterns.length > 0) {
        result.patternItems = await this.createItemsFromPatterns(
          analysisResults.patterns,
          userId
        );
      }

      // Create action items from recommendations
      if (analysisResults.recommendations && analysisResults.recommendations.length > 0) {
        result.actionItems = await this.createActionItems(
          analysisResults.recommendations,
          userId
        );
      }

      return result;
    } catch (error) {
      console.error('Error processing CSV analysis results:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getOrCreateAnomalyBoard(userId: string): Promise<any> {
    // Try to find existing anomaly board
    const boards = await this.storage.getProductivityBoards(userId);
    let anomalyBoard = boards.find(b => b.boardType === 'anomalies');

    if (!anomalyBoard) {
      // Create new anomaly detection board
      const boardId = await this.storage.createProductivityBoard({
        userId,
        title: 'Anomaly Detection Results',
        description: 'Automatically generated items from data anomaly detection',
        boardType: 'anomalies'
      });
      anomalyBoard = await this.storage.getProductivityBoard(boardId);

      // Create standard columns for anomaly board
      await this.createAnomalyBoardColumns(boardId);
    }

    return anomalyBoard;
  }

  private async getOrCreatePatternBoard(userId: string): Promise<any> {
    const boards = await this.storage.getProductivityBoards(userId);
    let patternBoard = boards.find(b => b.boardType === 'patterns');

    if (!patternBoard) {
      const boardId = await this.storage.createProductivityBoard({
        userId,
        title: 'Pattern Recognition Results',
        description: 'Automatically generated items from pattern analysis',
        boardType: 'patterns'
      });
      patternBoard = await this.storage.getProductivityBoard(boardId);

      // Create standard columns for pattern board
      await this.createPatternBoardColumns(boardId);
    }

    return patternBoard;
  }

  private async getOrCreatePredictiveBoard(userId: string): Promise<any> {
    const boards = await this.storage.getProductivityBoards(userId);
    let predictiveBoard = boards.find(b => b.title.includes('Predictive Analysis'));

    if (!predictiveBoard) {
      const boardId = await this.storage.createProductivityBoard({
        userId,
        title: 'Predictive Analysis Tasks',
        description: 'Automatically generated predictive tasks from trend analysis',
        boardType: 'tasks'
      });
      predictiveBoard = await this.storage.getProductivityBoard(boardId);

      // Create standard columns for predictive board
      await this.createPredictiveBoardColumns(boardId);
    }

    return predictiveBoard;
  }

  private async createAnomalyItem(
    anomaly: AnomalyDetectionResult,
    boardId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const priority = this.calculateAnomalyPriority(anomaly);
      const dueDate = this.calculateAnomalyDueDate(anomaly);

      const item = {
        boardId,
        title: `Anomaly Detected: ${anomaly.field || 'Unknown Field'}`,
        status: 'not_started' as const,
        priority,
        assignedTo: userId,
        createdBy: 'system',
        dueDate,
        metadata: {
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          detectedValue: anomaly.detectedValue,
          expectedRange: anomaly.expectedRange,
          confidence: anomaly.confidence,
          dataSource: anomaly.dataSource,
          timestamp: anomaly.timestamp
        }
      };

      return await this.storage.createProductivityItem(item);
    } catch (error) {
      console.error('Error creating anomaly item:', error);
      return null;
    }
  }

  private async createPatternItems(
    pattern: PatternRecognitionResult,
    boardId: string,
    userId: string
  ): Promise<string[]> {
    try {
      const items: string[] = [];

      // Create main pattern analysis item
      const mainItem = {
        boardId,
        title: `Pattern Analysis: ${pattern.patternType}`,
        status: 'not_started' as const,
        priority: this.calculatePatternPriority(pattern),
        assignedTo: userId,
        createdBy: 'system',
        dueDate: this.calculatePatternDueDate(pattern),
        metadata: {
          patternType: pattern.patternType,
          confidence: pattern.confidence,
          dataPoints: pattern.dataPoints,
          trend: pattern.trend,
          recommendations: pattern.recommendations
        }
      };

      const mainItemId = await this.storage.createProductivityItem(mainItem);
      if (mainItemId) items.push(mainItemId);

      // Create action items from pattern recommendations
      if (pattern.recommendations) {
        for (const recommendation of pattern.recommendations) {
          const actionItem = {
            boardId,
            title: `Action: ${recommendation.action}`,
            status: 'not_started' as const,
            priority: recommendation.priority || 'medium' as const,
            assignedTo: userId,
            createdBy: 'system',
            parentItemId: mainItemId,
            metadata: {
              recommendationType: recommendation.type,
              expectedImpact: recommendation.expectedImpact,
              relatedPattern: pattern.patternType
            }
          };

          const actionItemId = await this.storage.createProductivityItem(actionItem);
          if (actionItemId) items.push(actionItemId);
        }
      }

      return items;
    } catch (error) {
      console.error('Error creating pattern items:', error);
      return [];
    }
  }

  private async createPredictiveItems(
    trend: TrendAnalysisResult,
    boardId: string,
    userId: string
  ): Promise<string[]> {
    try {
      const items: string[] = [];

      // Create trend monitoring item
      const trendItem = {
        boardId,
        title: `Monitor Trend: ${trend.metric}`,
        status: 'not_started' as const,
        priority: this.calculateTrendPriority(trend),
        assignedTo: userId,
        createdBy: 'system',
        dueDate: trend.projectedDate ? new Date(trend.projectedDate) : undefined,
        metadata: {
          metric: trend.metric,
          direction: trend.direction,
          velocity: trend.velocity,
          confidence: trend.confidence,
          projectedValue: trend.projectedValue,
          currentValue: trend.currentValue
        }
      };

      const trendItemId = await this.storage.createProductivityItem(trendItem);
      if (trendItemId) items.push(trendItemId);

      // Create preventive action items if trend indicates issues
      if (trend.direction === 'declining' && trend.confidence > 0.7) {
        const preventiveItem = {
          boardId,
          title: `Prevent: ${trend.metric} Decline`,
          status: 'not_started' as const,
          priority: 'high' as const,
          assignedTo: userId,
          createdBy: 'system',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          parentItemId: trendItemId,
          metadata: {
            actionType: 'preventive',
            relatedTrend: trend.metric,
            urgency: 'high'
          }
        };

        const preventiveItemId = await this.storage.createProductivityItem(preventiveItem);
        if (preventiveItemId) items.push(preventiveItemId);
      }

      return items;
    } catch (error) {
      console.error('Error creating predictive items:', error);
      return [];
    }
  }

  private async createActionItems(
    recommendations: Recommendation[],
    userId: string
  ): Promise<string[]> {
    try {
      const items: string[] = [];

      // Get or create general action board
      const boards = await this.storage.getProductivityBoards(userId);
      let actionBoard = boards.find(b => b.title.includes('Action Items'));

      if (!actionBoard) {
        const boardId = await this.storage.createProductivityBoard({
          userId,
          title: 'Data Analysis Action Items',
          description: 'Action items generated from data analysis recommendations',
          boardType: 'tasks'
        });
        actionBoard = await this.storage.getProductivityBoard(boardId);
      }

      if (!actionBoard) return items;

      for (const recommendation of recommendations) {
        const actionItem = {
          boardId: actionBoard.id,
          title: recommendation.title || `Action: ${recommendation.action}`,
          status: 'not_started' as const,
          priority: recommendation.priority || 'medium' as const,
          assignedTo: userId,
          createdBy: 'system',
          dueDate: recommendation.dueDate ? new Date(recommendation.dueDate) : undefined,
          metadata: {
            recommendationType: recommendation.type,
            impact: recommendation.impact,
            effort: recommendation.effort,
            dataSource: recommendation.dataSource
          }
        };

        const itemId = await this.storage.createProductivityItem(actionItem);
        if (itemId) items.push(itemId);
      }

      return items;
    } catch (error) {
      console.error('Error creating action items:', error);
      return [];
    }
  }

  private async generateAssignmentSuggestion(
    insight: DataInsight,
    teamMembers: TeamMember[]
  ): Promise<TaskAssignmentSuggestion | null> {
    try {
      // Simple AI-like logic for task assignment suggestions
      const bestAssignee = this.findBestAssignee(insight, teamMembers);
      
      if (!bestAssignee) return null;

      return {
        insightId: insight.id,
        suggestedAssignee: bestAssignee.id,
        reason: this.generateAssignmentReason(insight, bestAssignee),
        confidence: this.calculateAssignmentConfidence(insight, bestAssignee),
        taskTitle: `Investigate: ${insight.title}`,
        taskDescription: insight.description,
        suggestedPriority: this.mapInsightPriority(insight.severity),
        suggestedDueDate: this.calculateSuggestedDueDate(insight.urgency)
      };
    } catch (error) {
      console.error('Error generating assignment suggestion:', error);
      return null;
    }
  }

  private findBestAssignee(insight: DataInsight, teamMembers: TeamMember[]): TeamMember | null {
    // Simple assignment logic based on skills and workload
    const relevantMembers = teamMembers.filter(member => 
      this.hasRelevantSkills(member, insight)
    );

    if (relevantMembers.length === 0) return teamMembers[0] || null;

    // Find member with lowest current workload
    return relevantMembers.reduce((best, current) => 
      (current.currentWorkload || 0) < (best.currentWorkload || 0) ? current : best
    );
  }

  private hasRelevantSkills(member: TeamMember, insight: DataInsight): boolean {
    const relevantSkills = ['data-analysis', 'statistics', 'research', 'analytics'];
    return member.skills?.some(skill => 
      relevantSkills.includes(skill.toLowerCase())
    ) || false;
  }

  // Helper methods for calculating priorities and due dates

  private calculateAnomalyPriority(anomaly: AnomalyDetectionResult): 'low' | 'medium' | 'high' | 'urgent' {
    if (anomaly.severity === 'critical' || anomaly.confidence > 0.9) return 'urgent';
    if (anomaly.severity === 'high' || anomaly.confidence > 0.7) return 'high';
    if (anomaly.severity === 'medium' || anomaly.confidence > 0.5) return 'medium';
    return 'low';
  }

  private calculatePatternPriority(pattern: PatternRecognitionResult): 'low' | 'medium' | 'high' | 'urgent' {
    if (pattern.confidence > 0.8 && pattern.trend === 'critical') return 'urgent';
    if (pattern.confidence > 0.6) return 'high';
    if (pattern.confidence > 0.4) return 'medium';
    return 'low';
  }

  private calculateTrendPriority(trend: TrendAnalysisResult): 'low' | 'medium' | 'high' | 'urgent' {
    if (trend.direction === 'declining' && trend.confidence > 0.8) return 'urgent';
    if (trend.direction === 'declining' && trend.confidence > 0.6) return 'high';
    if (trend.confidence > 0.7) return 'medium';
    return 'low';
  }

  private calculateAnomalyDueDate(anomaly: AnomalyDetectionResult): Date {
    const now = new Date();
    if (anomaly.severity === 'critical') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    } else if (anomaly.severity === 'high') {
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    } else {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    }
  }

  private calculatePatternDueDate(pattern: PatternRecognitionResult): Date {
    const now = new Date();
    const baseOffset = pattern.confidence > 0.7 ? 5 : 10; // days
    return new Date(now.getTime() + baseOffset * 24 * 60 * 60 * 1000);
  }

  private generateAssignmentReason(insight: DataInsight, assignee: TeamMember): string {
    return `Assigned to ${assignee.name} based on relevant skills in data analysis and current workload capacity.`;
  }

  private calculateAssignmentConfidence(insight: DataInsight, assignee: TeamMember): number {
    // Simple confidence calculation
    let confidence = 0.5;
    if (this.hasRelevantSkills(assignee, insight)) confidence += 0.3;
    if ((assignee.currentWorkload || 0) < 5) confidence += 0.2;
    return Math.min(confidence, 1.0);
  }

  private mapInsightPriority(severity: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private calculateSuggestedDueDate(urgency: string): Date {
    const now = new Date();
    switch (urgency?.toLowerCase()) {
      case 'immediate': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'high': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case 'medium': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
  }

  // Create standard columns for different board types

  private async createAnomalyBoardColumns(boardId: string): Promise<void> {
    const columns = [
      { name: 'Anomaly Type', type: 'dropdown', position: 1, settings: { options: ['statistical', 'temporal', 'contextual', 'collective'] } },
      { name: 'Severity', type: 'dropdown', position: 2, settings: { options: ['low', 'medium', 'high', 'critical'] } },
      { name: 'Confidence', type: 'numbers', position: 3, settings: { format: 'percentage' } },
      { name: 'Data Source', type: 'text', position: 4 },
      { name: 'Detection Date', type: 'date', position: 5 },
      { name: 'Investigation Status', type: 'status', position: 6 }
    ];

    for (const column of columns) {
      await this.storage.createItemColumn({
        boardId,
        ...column,
        isRequired: false,
        isVisible: true,
        width: 150
      });
    }
  }

  private async createPatternBoardColumns(boardId: string): Promise<void> {
    const columns = [
      { name: 'Pattern Type', type: 'dropdown', position: 1, settings: { options: ['trend', 'seasonal', 'cyclic', 'correlation'] } },
      { name: 'Confidence', type: 'numbers', position: 2, settings: { format: 'percentage' } },
      { name: 'Data Points', type: 'numbers', position: 3 },
      { name: 'Trend Direction', type: 'dropdown', position: 4, settings: { options: ['increasing', 'decreasing', 'stable', 'volatile'] } },
      { name: 'Analysis Date', type: 'date', position: 5 },
      { name: 'Action Status', type: 'status', position: 6 }
    ];

    for (const column of columns) {
      await this.storage.createItemColumn({
        boardId,
        ...column,
        isRequired: false,
        isVisible: true,
        width: 150
      });
    }
  }

  private async createPredictiveBoardColumns(boardId: string): Promise<void> {
    const columns = [
      { name: 'Prediction Type', type: 'dropdown', position: 1, settings: { options: ['trend', 'anomaly', 'threshold', 'classification'] } },
      { name: 'Confidence', type: 'numbers', position: 2, settings: { format: 'percentage' } },
      { name: 'Projected Date', type: 'date', position: 3 },
      { name: 'Impact Level', type: 'dropdown', position: 4, settings: { options: ['low', 'medium', 'high', 'critical'] } },
      { name: 'Monitoring Status', type: 'status', position: 5 },
      { name: 'Action Required', type: 'checkbox', position: 6 }
    ];

    for (const column of columns) {
      await this.storage.createItemColumn({
        boardId,
        ...column,
        isRequired: false,
        isVisible: true,
        width: 150
      });
    }
  }
}

// Type definitions for data pattern integration

interface AnomalyDetectionResult {
  id: string;
  type: 'statistical' | 'temporal' | 'contextual' | 'collective';
  field: string;
  detectedValue: any;
  expectedRange: { min: any; max: any };
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  dataSource: string;
  description?: string;
}

interface PatternRecognitionResult {
  id: string;
  patternType: 'trend' | 'seasonal' | 'cyclic' | 'correlation';
  confidence: number;
  dataPoints: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'critical';
  recommendations: PatternRecommendation[];
  metadata?: any;
}

interface PatternRecommendation {
  action: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

interface TrendAnalysisResult {
  id: string;
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  velocity: number;
  confidence: number;
  currentValue: number;
  projectedValue: number;
  projectedDate?: Date;
  metadata?: any;
}

interface DataInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  category: string;
  dataSource: string;
  relatedMetrics: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  skills: string[];
  currentWorkload?: number;
  availability: 'available' | 'busy' | 'unavailable';
}

interface TaskAssignmentSuggestion {
  insightId: string;
  suggestedAssignee: string;
  reason: string;
  confidence: number;
  taskTitle: string;
  taskDescription: string;
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedDueDate: Date;
}

interface CSVAnalysisResult {
  anomalies?: AnomalyDetectionResult[];
  patterns?: PatternRecognitionResult[];
  recommendations?: Recommendation[];
  summary: string;
  metadata?: any;
}

interface Recommendation {
  id: string;
  title?: string;
  action: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  dueDate?: Date;
  dataSource: string;
}

export {
  DataPatternIntegrationService,
  type AnomalyDetectionResult,
  type PatternRecognitionResult,
  type TrendAnalysisResult,
  type DataInsight,
  type TeamMember,
  type TaskAssignmentSuggestion,
  type CSVAnalysisResult
};