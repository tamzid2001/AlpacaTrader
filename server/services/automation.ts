import { IStorage } from '../storage';
import { 
  sendTaskAssignment, 
  sendStatusChange, 
  sendDueDateReminder,
  sendMentionNotification 
} from './email';

// Automation Engine for Monday.com-style automations
export class AutomationEngine {
  constructor(private storage: IStorage) {}

  // Process automation triggers when events occur
  async processAutomations(
    boardId: string,
    triggerId: string,
    context: {
      itemId?: string;
      userId?: string;
      oldValue?: any;
      newValue?: any;
      triggeredBy?: string;
    }
  ): Promise<void> {
    try {
      // Get all active automations for this board
      const automations = await this.storage.getBoardAutomations(boardId);
      
      // Filter automations that match the trigger
      const matchingAutomations = automations.filter(automation => 
        automation.isActive && automation.triggerType === triggerId
      );

      // Execute each matching automation
      for (const automation of matchingAutomations) {
        await this.executeAutomation(automation, context);
      }
    } catch (error) {
      console.error('Error processing automations:', error);
    }
  }

  // Execute a specific automation action
  private async executeAutomation(
    automation: any,
    context: any
  ): Promise<void> {
    try {
      const { actionType, actionConfig } = automation;
      
      switch (actionType) {
        case 'send_notification':
          await this.sendNotificationAction(automation, context, actionConfig);
          break;
          
        case 'update_status':
          await this.updateStatusAction(automation, context, actionConfig);
          break;
          
        case 'assign_user':
          await this.assignUserAction(automation, context, actionConfig);
          break;
          
        case 'create_item':
          await this.createItemAction(automation, context, actionConfig);
          break;
          
        case 'update_due_date':
          await this.updateDueDateAction(automation, context, actionConfig);
          break;
          
        case 'move_to_board':
          await this.moveToBoardAction(automation, context, actionConfig);
          break;
          
        case 'send_email':
          await this.sendEmailAction(automation, context, actionConfig);
          break;
          
        case 'archive_item':
          await this.archiveItemAction(automation, context, actionConfig);
          break;
          
        default:
          console.warn(`Unknown automation action: ${actionType}`);
      }
    } catch (error) {
      console.error(`Error executing automation ${automation.id}:`, error);
    }
  }

  // Action: Send in-app notification
  private async sendNotificationAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    const item = await this.storage.getProductivityItem(context.itemId);
    if (!item) return;
    
    const notification = {
      userId: config.userId || item.assignedTo,
      itemId: context.itemId,
      type: 'automation' as const,
      message: this.interpolateMessage(config.message, { item, context }),
      scheduledFor: new Date(),
      sent: false
    };
    
    await this.storage.createProductivityNotification(notification);
  }

  // Action: Update item status
  private async updateStatusAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    await this.storage.updateProductivityItem(context.itemId, {
      status: config.newStatus,
      updatedAt: new Date()
    });
  }

  // Action: Assign user to item
  private async assignUserAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    const item = await this.storage.getProductivityItem(context.itemId);
    if (!item) return;
    
    await this.storage.updateProductivityItem(context.itemId, {
      assignedTo: config.userId,
      updatedAt: new Date()
    });

    // Send assignment notification
    if (config.sendNotification && config.userId) {
      const assignedUser = await this.storage.getUser(config.userId);
      const board = await this.storage.getProductivityBoard(item.boardId);
      const assigner = context.triggeredBy ? await this.storage.getUser(context.triggeredBy) : null;
      
      if (assignedUser && board) {
        await sendTaskAssignment(
          assignedUser.email,
          assigner?.name || 'System',
          item.title,
          board.title,
          item.dueDate ? new Date(item.dueDate) : undefined,
          item.priority,
          assignedUser.id
        );
      }
    }
  }

  // Action: Create new item
  private async createItemAction(automation: any, context: any, config: any): Promise<void> {
    const sourceItem = context.itemId ? await this.storage.getProductivityItem(context.itemId) : null;
    
    const newItem = {
      boardId: config.boardId || automation.boardId,
      title: this.interpolateMessage(config.title, { item: sourceItem, context }),
      status: config.status || 'not_started',
      priority: config.priority || 'medium',
      assignedTo: config.assignedTo || sourceItem?.assignedTo,
      dueDate: config.dueDate ? new Date(config.dueDate) : undefined
    };
    
    await this.storage.createProductivityItem(newItem);
  }

  // Action: Update due date
  private async updateDueDateAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    let newDueDate: Date;
    
    if (config.dueDateType === 'relative') {
      // Add/subtract days from current date
      newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + config.daysOffset);
    } else if (config.dueDateType === 'specific') {
      newDueDate = new Date(config.specificDate);
    } else {
      return;
    }
    
    await this.storage.updateProductivityItem(context.itemId, {
      dueDate: newDueDate,
      updatedAt: new Date()
    });
  }

  // Action: Move item to another board
  private async moveToBoardAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId || !config.targetBoardId) return;
    
    await this.storage.updateProductivityItem(context.itemId, {
      boardId: config.targetBoardId,
      updatedAt: new Date()
    });
  }

  // Action: Send email notification
  private async sendEmailAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    const item = await this.storage.getProductivityItem(context.itemId);
    const board = item ? await this.storage.getProductivityBoard(item.boardId) : null;
    
    if (!item || !board) return;
    
    const recipient = config.recipientType === 'assignee' && item.assignedTo 
      ? await this.storage.getUser(item.assignedTo)
      : config.recipientType === 'specific' 
      ? await this.storage.getUser(config.recipientId)
      : null;
    
    if (!recipient) return;
    
    const subject = this.interpolateMessage(config.subject, { item, board, context });
    const message = this.interpolateMessage(config.message, { item, board, context });
    
    // Send custom email notification
    await sendMentionNotification(
      recipient.email,
      'Automation System',
      item.title,
      board.title,
      message,
      recipient.id
    );
  }

  // Action: Archive item
  private async archiveItemAction(automation: any, context: any, config: any): Promise<void> {
    if (!context.itemId) return;
    
    await this.storage.updateProductivityItem(context.itemId, {
      status: 'archived',
      updatedAt: new Date()
    });
  }

  // Interpolate dynamic values in messages
  private interpolateMessage(template: string, data: any): string {
    if (!template) return '';
    
    return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  // Get nested object value by path (e.g., "item.title")
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Template Management Service
export class TemplateService {
  constructor(private storage: IStorage) {}

  // Create a template from an existing board
  async createTemplateFromBoard(
    boardId: string,
    templateData: {
      name: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
      createdBy: string;
    }
  ): Promise<string> {
    try {
      // Get the source board and its structure
      const board = await this.storage.getProductivityBoard(boardId);
      if (!board) {
        throw new Error('Board not found');
      }

      const items = await this.storage.getProductivityItems(boardId);
      const columns = await this.storage.getItemColumns(boardId);
      const automations = await this.storage.getBoardAutomations(boardId);

      // Create template configuration
      const templateConfig = {
        boardStructure: {
          title: board.title,
          description: board.description,
          boardType: board.boardType
        },
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          position: col.position,
          settings: col.settings
        })),
        sampleItems: items.slice(0, 5).map(item => ({ // Include up to 5 sample items
          title: item.title,
          status: item.status,
          priority: item.priority,
          // Remove specific user assignments and dates for template
          assignedTo: null,
          dueDate: null
        })),
        automations: automations.map(auto => ({
          name: auto.name,
          description: auto.description,
          triggerType: auto.triggerType,
          triggerConfig: auto.triggerConfig,
          actionType: auto.actionType,
          actionConfig: auto.actionConfig,
          isActive: auto.isActive
        }))
      };

      // Create the template
      const template = {
        name: templateData.name,
        description: templateData.description || '',
        category: templateData.category || 'general',
        templateConfig: JSON.stringify(templateConfig),
        isPublic: templateData.isPublic || false,
        createdBy: templateData.createdBy,
        usageCount: 0
      };

      return await this.storage.createBoardTemplate(template);
    } catch (error) {
      console.error('Error creating template from board:', error);
      throw error;
    }
  }

  // Create a new board from a template
  async createBoardFromTemplate(
    templateId: string,
    userId: string,
    customization?: {
      title?: string;
      description?: string;
      includeAutomations?: boolean;
      includeSampleItems?: boolean;
    }
  ): Promise<string> {
    try {
      const template = await this.storage.getBoardTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const config = JSON.parse(template.templateConfig);
      
      // Create the new board
      const boardData = {
        userId,
        title: customization?.title || config.boardStructure.title,
        description: customization?.description || config.boardStructure.description,
        boardType: config.boardStructure.boardType || 'general'
      };

      const boardId = await this.storage.createProductivityBoard(boardData);

      // Create columns
      for (const columnConfig of config.columns) {
        const column = {
          boardId,
          name: columnConfig.name,
          type: columnConfig.type,
          position: columnConfig.position,
          settings: columnConfig.settings
        };
        await this.storage.createItemColumn(column);
      }

      // Create sample items if requested
      if (customization?.includeSampleItems !== false && config.sampleItems) {
        for (const itemConfig of config.sampleItems) {
          const item = {
            boardId,
            title: itemConfig.title,
            status: itemConfig.status,
            priority: itemConfig.priority,
            assignedTo: null // Don't assign sample items
          };
          await this.storage.createProductivityItem(item);
        }
      }

      // Create automations if requested
      if (customization?.includeAutomations !== false && config.automations) {
        for (const autoConfig of config.automations) {
          const automation = {
            boardId,
            name: autoConfig.name,
            description: autoConfig.description,
            triggerType: autoConfig.triggerType,
            triggerConfig: autoConfig.triggerConfig,
            actionType: autoConfig.actionType,
            actionConfig: autoConfig.actionConfig,
            isActive: autoConfig.isActive,
            createdBy: userId
          };
          await this.storage.createBoardAutomation(automation);
        }
      }

      // Increment template usage count
      await this.storage.updateBoardTemplate(templateId, {
        usageCount: template.usageCount + 1
      });

      return boardId;
    } catch (error) {
      console.error('Error creating board from template:', error);
      throw error;
    }
  }

  // Get popular templates
  async getPopularTemplates(limit: number = 10): Promise<any[]> {
    const templates = await this.storage.getBoardTemplates();
    return templates
      .filter(t => t.isPublic)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // Get templates by category
  async getTemplatesByCategory(category: string): Promise<any[]> {
    const templates = await this.storage.getBoardTemplates();
    return templates.filter(t => t.isPublic && t.category === category);
  }

  // Search templates
  async searchTemplates(query: string): Promise<any[]> {
    const templates = await this.storage.getBoardTemplates();
    const lowercaseQuery = query.toLowerCase();
    
    return templates.filter(t => 
      t.isPublic && (
        t.name.toLowerCase().includes(lowercaseQuery) ||
        t.description.toLowerCase().includes(lowercaseQuery) ||
        t.category.toLowerCase().includes(lowercaseQuery)
      )
    );
  }
}

// Common automation triggers
export const AUTOMATION_TRIGGERS = {
  STATUS_CHANGED: 'status_changed',
  ITEM_CREATED: 'item_created',
  DUE_DATE_APPROACHING: 'due_date_approaching',
  ITEM_ASSIGNED: 'item_assigned',
  PRIORITY_CHANGED: 'priority_changed',
  DUE_DATE_PASSED: 'due_date_passed',
  COLUMN_VALUE_CHANGED: 'column_value_changed',
  ITEM_COMPLETED: 'item_completed'
} as const;

// Common automation actions
export const AUTOMATION_ACTIONS = {
  SEND_NOTIFICATION: 'send_notification',
  UPDATE_STATUS: 'update_status',
  ASSIGN_USER: 'assign_user',
  CREATE_ITEM: 'create_item',
  UPDATE_DUE_DATE: 'update_due_date',
  MOVE_TO_BOARD: 'move_to_board',
  SEND_EMAIL: 'send_email',
  ARCHIVE_ITEM: 'archive_item'
} as const;

// Predefined automation templates
export const AUTOMATION_TEMPLATES = [
  {
    name: 'Auto-assign on status change',
    description: 'Automatically assign a user when status changes to "In Progress"',
    triggerType: AUTOMATION_TRIGGERS.STATUS_CHANGED,
    triggerConfig: { fromStatus: 'not_started', toStatus: 'in_progress' },
    actionType: AUTOMATION_ACTIONS.ASSIGN_USER,
    actionConfig: { userId: '{{board_owner}}', sendNotification: true }
  },
  {
    name: 'Due date reminder',
    description: 'Send reminder 1 day before due date',
    triggerType: AUTOMATION_TRIGGERS.DUE_DATE_APPROACHING,
    triggerConfig: { daysBeforeDue: 1 },
    actionType: AUTOMATION_ACTIONS.SEND_EMAIL,
    actionConfig: { 
      recipientType: 'assignee',
      subject: 'Reminder: {item.title} due tomorrow',
      message: 'Your task "{item.title}" is due tomorrow. Please complete it on time.'
    }
  },
  {
    name: 'Create follow-up task',
    description: 'Create a follow-up task when item is completed',
    triggerType: AUTOMATION_TRIGGERS.ITEM_COMPLETED,
    triggerConfig: {},
    actionType: AUTOMATION_ACTIONS.CREATE_ITEM,
    actionConfig: {
      title: 'Follow-up: {item.title}',
      status: 'not_started',
      priority: 'medium',
      daysOffset: 7
    }
  },
  {
    name: 'Overdue notification',
    description: 'Send notification when task becomes overdue',
    triggerType: AUTOMATION_TRIGGERS.DUE_DATE_PASSED,
    triggerConfig: {},
    actionType: AUTOMATION_ACTIONS.SEND_NOTIFICATION,
    actionConfig: {
      message: 'Task "{item.title}" is now overdue. Please address it immediately.'
    }
  }
];