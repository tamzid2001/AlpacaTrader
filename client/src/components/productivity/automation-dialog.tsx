import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Zap, Plus, Trash2, Copy, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const AUTOMATION_TRIGGERS = {
  status_changed: 'When status changes',
  item_created: 'When item is created',
  due_date_approaching: 'When due date is approaching',
  item_assigned: 'When item is assigned',
  priority_changed: 'When priority changes',
  due_date_passed: 'When due date passes',
  column_value_changed: 'When column value changes',
  item_completed: 'When item is completed'
};

const AUTOMATION_ACTIONS = {
  send_notification: 'Send notification',
  update_status: 'Update status',
  assign_user: 'Assign user',
  create_item: 'Create item',
  update_due_date: 'Update due date',
  move_to_board: 'Move to board',
  send_email: 'Send email',
  archive_item: 'Archive item'
};

const PREDEFINED_TEMPLATES = [
  {
    name: 'Auto-assign on status change',
    description: 'Automatically assign a user when status changes to "In Progress"',
    triggerType: 'status_changed',
    triggerConfig: { fromStatus: 'not_started', toStatus: 'in_progress' },
    actionType: 'assign_user',
    actionConfig: { sendNotification: true }
  },
  {
    name: 'Due date reminder',
    description: 'Send reminder 1 day before due date',
    triggerType: 'due_date_approaching',
    triggerConfig: { daysBeforeDue: 1 },
    actionType: 'send_email',
    actionConfig: { 
      recipientType: 'assignee',
      subject: 'Reminder: {item.title} due tomorrow',
      message: 'Your task "{item.title}" is due tomorrow. Please complete it on time.'
    }
  },
  {
    name: 'Create follow-up task',
    description: 'Create a follow-up task when item is completed',
    triggerType: 'item_completed',
    triggerConfig: {},
    actionType: 'create_item',
    actionConfig: {
      title: 'Follow-up: {item.title}',
      status: 'not_started',
      priority: 'medium',
      daysOffset: 7
    }
  }
];

interface AutomationDialogProps {
  boardId: string;
  children: React.ReactNode;
}

export function AutomationDialog({ boardId, children }: AutomationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [automationForm, setAutomationForm] = useState({
    name: '',
    description: '',
    triggerType: '',
    triggerConfig: {},
    actionType: '',
    actionConfig: {},
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing automations
  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['/api/productivity/automations', boardId],
    enabled: open
  });

  // Create automation mutation
  const createAutomation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/productivity/automations`, {
      method: 'POST',
      body: JSON.stringify({ ...data, boardId })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/automations', boardId] });
      setAutomationForm({
        name: '',
        description: '',
        triggerType: '',
        triggerConfig: {},
        actionType: '',
        actionConfig: {},
        isActive: true
      });
      toast({ title: 'Automation created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create automation', variant: 'destructive' });
    }
  });

  // Delete automation mutation
  const deleteAutomation = useMutation({
    mutationFn: (automationId: string) => apiRequest(`/api/productivity/automations/${automationId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/automations', boardId] });
      toast({ title: 'Automation deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete automation', variant: 'destructive' });
    }
  });

  // Toggle automation active state
  const toggleAutomation = useMutation({
    mutationFn: ({ automationId, isActive }: { automationId: string; isActive: boolean }) => 
      apiRequest(`/api/productivity/automations/${automationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/automations', boardId] });
    }
  });

  const handleTemplateSelect = (templateName: string) => {
    const template = PREDEFINED_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setAutomationForm({
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        actionType: template.actionType,
        actionConfig: template.actionConfig,
        isActive: true
      });
      setSelectedTemplate(templateName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAutomation.mutate(automationForm);
  };

  const renderTriggerConfig = () => {
    switch (automationForm.triggerType) {
      case 'status_changed':
        return (
          <div className="space-y-2">
            <Label>From Status</Label>
            <Select
              value={automationForm.triggerConfig?.fromStatus || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                triggerConfig: { ...prev.triggerConfig, fromStatus: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Label>To Status</Label>
            <Select
              value={automationForm.triggerConfig?.toStatus || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                triggerConfig: { ...prev.triggerConfig, toStatus: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'due_date_approaching':
        return (
          <div className="space-y-2">
            <Label>Days Before Due</Label>
            <Input
              type="number"
              value={automationForm.triggerConfig?.daysBeforeDue || ''}
              onChange={(e) => setAutomationForm(prev => ({
                ...prev,
                triggerConfig: { ...prev.triggerConfig, daysBeforeDue: parseInt(e.target.value) }
              }))}
              placeholder="Number of days"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionConfig = () => {
    switch (automationForm.actionType) {
      case 'update_status':
        return (
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select
              value={automationForm.actionConfig?.newStatus || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, newStatus: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'send_email':
        return (
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={automationForm.actionConfig?.subject || ''}
              onChange={(e) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, subject: e.target.value }
              }))}
              placeholder="Email subject (use {item.title} for dynamic values)"
            />
            <Label>Message</Label>
            <Textarea
              value={automationForm.actionConfig?.message || ''}
              onChange={(e) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, message: e.target.value }
              }))}
              placeholder="Email message (use {item.title}, {board.title} for dynamic values)"
              rows={3}
            />
            <Label>Recipient</Label>
            <Select
              value={automationForm.actionConfig?.recipientType || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, recipientType: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignee">Assigned User</SelectItem>
                <SelectItem value="board_owner">Board Owner</SelectItem>
                <SelectItem value="specific">Specific User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'create_item':
        return (
          <div className="space-y-2">
            <Label>Item Title</Label>
            <Input
              value={automationForm.actionConfig?.title || ''}
              onChange={(e) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, title: e.target.value }
              }))}
              placeholder="New item title (use {item.title} for dynamic values)"
            />
            <Label>Status</Label>
            <Select
              value={automationForm.actionConfig?.status || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, status: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Label>Priority</Label>
            <Select
              value={automationForm.actionConfig?.priority || ''}
              onValueChange={(value) => setAutomationForm(prev => ({
                ...prev,
                actionConfig: { ...prev.actionConfig, priority: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Board Automations
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="automations" className="w-full">
          <TabsList>
            <TabsTrigger value="automations">Manage Automations</TabsTrigger>
            <TabsTrigger value="create">Create Automation</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="automations" className="space-y-4">
            <div className="grid gap-4">
              {isLoading ? (
                <p className="text-muted-foreground">Loading automations...</p>
              ) : automations.length === 0 ? (
                <p className="text-muted-foreground">No automations created yet.</p>
              ) : (
                automations.map((automation: any) => (
                  <Card key={automation.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.isActive}
                            onCheckedChange={(checked) => 
                              toggleAutomation.mutate({ automationId: automation.id, isActive: checked })
                            }
                            data-testid={`switch-automation-${automation.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAutomation.mutate(automation.id)}
                            data-testid={`button-delete-automation-${automation.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{automation.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>Trigger:</strong> {AUTOMATION_TRIGGERS[automation.triggerType]} • 
                        <strong> Action:</strong> {AUTOMATION_ACTIONS[automation.actionType]}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Name</Label>
                  <Input
                    id="automation-name"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Automation name"
                    required
                    data-testid="input-automation-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="automation-description">Description</Label>
                  <Input
                    id="automation-description"
                    value={automationForm.description}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description"
                    data-testid="input-automation-description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger (When...)</Label>
                  <Select
                    value={automationForm.triggerType}
                    onValueChange={(value) => setAutomationForm(prev => ({ 
                      ...prev, 
                      triggerType: value,
                      triggerConfig: {}
                    }))}
                  >
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUTOMATION_TRIGGERS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderTriggerConfig()}
                </div>

                <div className="space-y-2">
                  <Label>Action (Then...)</Label>
                  <Select
                    value={automationForm.actionType}
                    onValueChange={(value) => setAutomationForm(prev => ({ 
                      ...prev, 
                      actionType: value,
                      actionConfig: {}
                    }))}
                  >
                    <SelectTrigger data-testid="select-action-type">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUTOMATION_ACTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderActionConfig()}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createAutomation.isPending}
                  data-testid="button-create-automation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Predefined Templates</h3>
              {PREDEFINED_TEMPLATES.map((template) => (
                <Card key={template.name} className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTemplateSelect(template.name)}
                        data-testid={`button-use-template-${template.name.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}