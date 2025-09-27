import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ColumnDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ColumnOption {
  value: string;
  label: string;
  color?: string;
}

export function ColumnDialog({ boardId, open, onOpenChange }: ColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [width, setWidth] = useState("150");
  const [options, setOptions] = useState<ColumnOption[]>([]);
  const [newOption, setNewOption] = useState({ value: "", label: "", color: "#3B82F6" });
  const [maxRating, setMaxRating] = useState("5");
  const [formula, setFormula] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setName("");
      setType("text");
      setIsRequired(false);
      setWidth("150");
      setOptions([]);
      setNewOption({ value: "", label: "", color: "#3B82F6" });
      setMaxRating("5");
      setFormula("");
    }
  }, [open]);

  const createColumnMutation = useMutation({
    mutationFn: async (columnData: any) => {
      return apiRequest(`/api/productivity/boards/${boardId}/columns`, {
        method: 'POST',
        body: JSON.stringify(columnData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
      toast({ title: "Column created successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create column", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Column name is required", variant: "destructive" });
      return;
    }

    let settings: any = {};

    // Configure settings based on column type
    switch (type) {
      case 'dropdown':
      case 'status':
        if (options.length === 0) {
          toast({ title: "At least one option is required for dropdown/status columns", variant: "destructive" });
          return;
        }
        settings.options = options;
        break;
      case 'rating':
        settings.maxRating = parseInt(maxRating);
        break;
      case 'formula':
        if (!formula.trim()) {
          toast({ title: "Formula is required for formula columns", variant: "destructive" });
          return;
        }
        settings.formula = formula;
        break;
    }

    const columnData = {
      name: name.trim(),
      type,
      position: 999, // Will be adjusted by the backend
      isRequired,
      width: parseInt(width),
      settings: Object.keys(settings).length > 0 ? settings : undefined,
    };

    createColumnMutation.mutate(columnData);
  };

  const handleAddOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast({ title: "Option value and label are required", variant: "destructive" });
      return;
    }

    if (options.some(opt => opt.value === newOption.value)) {
      toast({ title: "Option value must be unique", variant: "destructive" });
      return;
    }

    setOptions([...options, { ...newOption }]);
    setNewOption({ value: "", label: "", color: "#3B82F6" });
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const columnTypeOptions = [
    { value: "text", label: "Text" },
    { value: "date", label: "Date" },
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
    { value: "numbers", label: "Numbers" },
    { value: "people", label: "People" },
    { value: "dropdown", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
    { value: "rating", label: "Rating" },
    { value: "timeline", label: "Timeline" },
    { value: "formula", label: "Formula" },
  ];

  const showOptionsConfig = ["dropdown", "status"].includes(type);
  const showRatingConfig = type === "rating";
  const showFormulaConfig = type === "formula";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="column-dialog">
        <DialogHeader>
          <DialogTitle data-testid="column-dialog-title">Create New Column</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Column Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter column name..."
                    data-testid="input-column-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Column Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger data-testid="select-column-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columnTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="100"
                    max="500"
                    data-testid="input-column-width"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isRequired"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                    data-testid="checkbox-required"
                  />
                  <Label htmlFor="isRequired">Required field</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Configuration for Dropdown/Status */}
          {showOptionsConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="optionValue">Value</Label>
                    <Input
                      id="optionValue"
                      value={newOption.value}
                      onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      placeholder="option_value"
                      data-testid="input-option-value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionLabel">Label</Label>
                    <Input
                      id="optionLabel"
                      value={newOption.label}
                      onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                      placeholder="Display Label"
                      data-testid="input-option-label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionColor">Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="optionColor"
                        type="color"
                        value={newOption.color}
                        onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                        className="w-8 h-8 rounded border"
                        data-testid="input-option-color"
                      />
                      <Button type="button" onClick={handleAddOption} size="sm" data-testid="button-add-option">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {options.length > 0 && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: option.color }}
                            />
                            <Badge variant="outline">{option.value}</Badge>
                            <span>{option.label}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            data-testid={`remove-option-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rating Configuration */}
          {showRatingConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="maxRating">Maximum Rating</Label>
                  <Select value={maxRating} onValueChange={setMaxRating}>
                    <SelectTrigger data-testid="select-max-rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="10">10 Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formula Configuration */}
          {showFormulaConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formula Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="formula">Formula</Label>
                  <Input
                    id="formula"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="e.g., {estimated_hours} * {hourly_rate}"
                    data-testid="input-formula"
                  />
                  <p className="text-xs text-gray-500">
                    Use {"{column_name}"} to reference other columns. Example: {"{quantity} * {price}"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createColumnMutation.isPending}
              data-testid="button-create-column"
            >
              {createColumnMutation.isPending ? "Creating..." : "Create Column"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}