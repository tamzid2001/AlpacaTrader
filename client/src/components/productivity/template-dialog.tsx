import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Files, Search, Plus, Eye, Star, Download, Upload, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const TEMPLATE_CATEGORIES = [
  'general',
  'project-management',
  'marketing',
  'sales',
  'hr',
  'development',
  'design',
  'finance'
];

interface TemplateDialogProps {
  boardId?: string;
  children: React.ReactNode;
}

export function TemplateDialog({ boardId, children }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [createTemplateForm, setCreateTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general',
    isPublic: false
  });
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [useTemplateForm, setUseTemplateForm] = useState({
    title: '',
    description: '',
    includeAutomations: true,
    includeSampleItems: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/productivity/templates'],
    enabled: open
  });

  // Fetch popular templates
  const { data: popularTemplates = [] } = useQuery({
    queryKey: ['/api/productivity/templates/popular'],
    enabled: open
  });

  // Create template from board mutation
  const createTemplate = useMutation({
    mutationFn: (data: any) => apiRequest('/api/productivity/templates', {
      method: 'POST',
      body: JSON.stringify({ ...data, boardId })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/templates'] });
      setCreateTemplateForm({
        name: '',
        description: '',
        category: 'general',
        isPublic: false
      });
      toast({ title: 'Template created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    }
  });

  // Create board from template mutation
  const createBoardFromTemplate = useMutation({
    mutationFn: (data: any) => apiRequest('/api/productivity/boards/from-template', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      toast({ title: 'Board created from template successfully' });
      setOpen(false);
      // Navigate to the new board
      window.location.href = `/productivity/${data.boardId}`;
    },
    onError: () => {
      toast({ title: 'Failed to create board from template', variant: 'destructive' });
    }
  });

  const filteredTemplates = templates.filter((template: any) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) {
      toast({ title: 'No board selected for template creation', variant: 'destructive' });
      return;
    }
    createTemplate.mutate(createTemplateForm);
  };

  const handleUseTemplate = (template: any) => {
    createBoardFromTemplate.mutate({
      templateId: template.id,
      title: useTemplateForm.title || template.name,
      description: useTemplateForm.description,
      includeAutomations: useTemplateForm.includeAutomations,
      includeSampleItems: useTemplateForm.includeSampleItems
    });
  };

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Board Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList>
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            {boardId && <TabsTrigger value="create">Create Template</TabsTrigger>}
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-10"
                  data-testid="input-search-templates"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <p className="col-span-full text-muted-foreground">Loading templates...</p>
              ) : filteredTemplates.length === 0 ? (
                <p className="col-span-full text-muted-foreground">No templates found.</p>
              ) : (
                filteredTemplates.map((template: any) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2">{template.name}</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {formatUsageCount(template.usageCount)} uses
                        </span>
                        <span>by {template.createdBy}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                          className="flex-1"
                          data-testid={`button-preview-template-${template.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setUseTemplateForm({
                              title: template.name + ' Copy',
                              description: '',
                              includeAutomations: true,
                              includeSampleItems: true
                            });
                          }}
                          className="flex-1"
                          data-testid={`button-use-template-${template.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularTemplates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">{template.name}</CardTitle>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{formatUsageCount(template.usageCount)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    
                    <Badge variant="secondary">{template.category}</Badge>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1"
                        data-testid={`button-preview-popular-${template.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setUseTemplateForm({
                            title: template.name + ' Copy',
                            description: '',
                            includeAutomations: true,
                            includeSampleItems: true
                          });
                        }}
                        className="flex-1"
                        data-testid={`button-use-popular-${template.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {boardId && (
            <TabsContent value="create" className="space-y-4">
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={createTemplateForm.name}
                      onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      required
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={createTemplateForm.category}
                      onValueChange={(value) => setCreateTemplateForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-template-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={createTemplateForm.description}
                    onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this template is used for..."
                    rows={3}
                    data-testid="textarea-template-description"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-public"
                    checked={createTemplateForm.isPublic}
                    onCheckedChange={(checked) => setCreateTemplateForm(prev => ({ ...prev, isPublic: checked }))}
                    data-testid="switch-template-public"
                  />
                  <Label htmlFor="template-public">Make template public (others can use it)</Label>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createTemplate.isPending}
                    data-testid="button-create-template"
                  >
                    <Files className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </form>
            </TabsContent>
          )}
        </Tabs>

        {/* Template Preview/Use Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedTemplate.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Category</Label>
                    <p className="mt-1">{selectedTemplate.category}</p>
                  </div>
                  <div>
                    <Label>Usage Count</Label>
                    <p className="mt-1">{formatUsageCount(selectedTemplate.usageCount)} times</p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Create Board from Template</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="board-title">Board Title</Label>
                      <Input
                        id="board-title"
                        value={useTemplateForm.title}
                        onChange={(e) => setUseTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter board title"
                        data-testid="input-board-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="board-description">Description (Optional)</Label>
                      <Input
                        id="board-description"
                        value={useTemplateForm.description}
                        onChange={(e) => setUseTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description"
                        data-testid="input-board-description"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-automations"
                        checked={useTemplateForm.includeAutomations}
                        onCheckedChange={(checked) => setUseTemplateForm(prev => ({ ...prev, includeAutomations: checked }))}
                        data-testid="switch-include-automations"
                      />
                      <Label htmlFor="include-automations">Include automations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-sample-items"
                        checked={useTemplateForm.includeSampleItems}
                        onCheckedChange={(checked) => setUseTemplateForm(prev => ({ ...prev, includeSampleItems: checked }))}
                        data-testid="switch-include-sample-items"
                      />
                      <Label htmlFor="include-sample-items">Include sample items</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTemplate(null)}
                      data-testid="button-cancel-template"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => handleUseTemplate(selectedTemplate)}
                      disabled={createBoardFromTemplate.isPending}
                      data-testid="button-create-from-template"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Board
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}