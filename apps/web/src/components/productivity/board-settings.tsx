import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Palette, Users, Bell, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductivityBoard } from "./productivity-board";

interface BoardSettingsProps {
  board: ProductivityBoard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardSettings({ board, open, onOpenChange }: BoardSettingsProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<string>("tasks");
  const [color, setColor] = useState("#037ffc");
  const [isPublic, setIsPublic] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (board && open) {
      setTitle(board.title || "");
      setDescription(board.description || "");
      setBoardType(board.boardType || "tasks");
      setColor(board.color || "#037ffc");
      setIsPublic(board.isPublic || false);
      setIsTemplate(board.isTemplate || false);
      setDeleteConfirmation("");
      setShowDeleteConfirm(false);
    }
  }, [board, open]);

  const updateBoardMutation = useMutation({
    mutationFn: async (updates: Partial<ProductivityBoard>) => {
      return apiRequest(`/api/productivity/boards/${board.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      toast({ title: "Board updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update board", description: error.message, variant: "destructive" });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/productivity/boards/${board.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      toast({ title: "Board deleted successfully" });
      onOpenChange(false);
      // Redirect to boards list or dashboard
      window.location.href = '/productivity';
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete board", description: error.message, variant: "destructive" });
    },
  });

  const duplicateBoardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/productivity/boards/${board.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newTitle: `${title} (Copy)` }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      toast({ title: "Board duplicated successfully" });
      // Redirect to the new board
      window.location.href = `/productivity/boards/${data.board.id}`;
    },
    onError: (error: any) => {
      toast({ title: "Failed to duplicate board", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Board title is required", variant: "destructive" });
      return;
    }

    const updates = {
      title: title.trim(),
      description: description.trim() || undefined,
      boardType: boardType as any,
      color,
      isPublic,
      isTemplate,
    };

    updateBoardMutation.mutate(updates);
  };

  const handleDelete = () => {
    if (deleteConfirmation !== board.title) {
      toast({ title: "Please type the board title to confirm deletion", variant: "destructive" });
      return;
    }

    deleteBoardMutation.mutate();
  };

  const boardTypeOptions = [
    { value: "tasks", label: "Tasks", description: "General task management" },
    { value: "anomalies", label: "Anomalies", description: "Data anomaly tracking" },
    { value: "patterns", label: "Patterns", description: "Pattern analysis results" },
    { value: "general", label: "General", description: "General purpose board" },
  ];

  const colorPresets = [
    "#037ffc", "#7c3aed", "#dc2626", "#ea580c", 
    "#ca8a04", "#16a34a", "#0891b2", "#c2410c",
    "#9333ea", "#be123c", "#0f766e", "#4338ca"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="board-settings-dialog">
        <DialogHeader>
          <DialogTitle data-testid="board-settings-title">Board Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Board Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter board title..."
                  data-testid="input-board-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter board description..."
                  rows={3}
                  data-testid="input-board-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boardType">Board Type</Label>
                <Select value={boardType} onValueChange={setBoardType}>
                  <SelectTrigger data-testid="select-board-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boardTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Board Color</Label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                    data-testid="input-board-color"
                  />
                </div>
                
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      className="w-8 h-8 rounded border-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{ backgroundColor: preset }}
                      onClick={() => setColor(preset)}
                      data-testid={`color-preset-${preset}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Privacy & Sharing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  data-testid="checkbox-public"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Public Board</div>
                    <div className="text-sm text-gray-500">
                      Allow other users to view this board
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTemplate"
                  checked={isTemplate}
                  onCheckedChange={setIsTemplate}
                  data-testid="checkbox-template"
                />
                <Label htmlFor="isTemplate" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Template Board</div>
                    <div className="text-sm text-gray-500">
                      Make this board available as a template for others
                    </div>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Board Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => duplicateBoardMutation.mutate()}
                disabled={duplicateBoardMutation.isPending}
                className="w-full justify-start"
                data-testid="button-duplicate-board"
              >
                <Copy className="w-4 h-4 mr-2" />
                {duplicateBoardMutation.isPending ? "Duplicating..." : "Duplicate Board"}
              </Button>

              <Separator />

              {/* Delete Board Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-red-600">Danger Zone</div>
                    <div className="text-sm text-gray-500">
                      Permanently delete this board and all its data
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    data-testid="button-show-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Board
                  </Button>
                </div>

                {showDeleteConfirm && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertDescription>
                      <div className="space-y-4">
                        <div className="font-medium text-red-800 dark:text-red-200">
                          This action cannot be undone. This will permanently delete the board and all its items.
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Type <strong>{board.title}</strong> to confirm:
                          </Label>
                          <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder={board.title}
                            data-testid="input-delete-confirmation"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmation !== board.title || deleteBoardMutation.isPending}
                            data-testid="button-confirm-delete"
                          >
                            {deleteBoardMutation.isPending ? "Deleting..." : "Delete Board"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            data-testid="button-cancel-delete"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Save/Cancel Buttons */}
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
              onClick={handleSave}
              disabled={updateBoardMutation.isPending}
              data-testid="button-save"
            >
              {updateBoardMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}