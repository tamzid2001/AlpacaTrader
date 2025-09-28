import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Grid, List, Search, Filter, MoreHorizontal, Edit, Trash2, Copy, Users, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductivityBoard } from "@/components/productivity/productivity-board";

export function ProductivityDashboard() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [newBoardType, setNewBoardType] = useState("tasks");
  const [newBoardColor, setNewBoardColor] = useState("#037ffc");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's productivity boards
  const { data: boardsData, isLoading } = useQuery({
    queryKey: ['/api/productivity/boards'],
  });

  const boards = boardsData?.boards || [];

  // Fetch productivity stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/productivity/stats'],
  });

  const stats = statsData?.stats || {};

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: async (boardData: any) => {
      return apiRequest('/api/productivity/boards', {
        method: 'POST',
        body: JSON.stringify(boardData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/stats'] });
      setShowCreateDialog(false);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setNewBoardType("tasks");
      setNewBoardColor("#037ffc");
      toast({ title: "Board created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create board", description: error.message, variant: "destructive" });
    },
  });

  // Delete board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      return apiRequest(`/api/productivity/boards/${boardId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/stats'] });
      toast({ title: "Board deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete board", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) {
      toast({ title: "Board title is required", variant: "destructive" });
      return;
    }

    const boardData = {
      title: newBoardTitle.trim(),
      description: newBoardDescription.trim() || undefined,
      boardType: newBoardType,
      color: newBoardColor,
      isTemplate: false,
      isPublic: false,
    };

    createBoardMutation.mutate(boardData);
  };

  const handleDeleteBoard = (boardId: string, boardTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${boardTitle}"? This action cannot be undone.`)) {
      deleteBoardMutation.mutate(boardId);
    }
  };

  // Filter boards
  const filteredBoards = boards.filter((board: ProductivityBoard) => {
    const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || board.boardType === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const boardTypeLabels = {
    tasks: "Tasks",
    anomalies: "Anomalies",
    patterns: "Patterns",
    general: "General",
  };

  const colorPresets = [
    "#037ffc", "#7c3aed", "#dc2626", "#ea580c", 
    "#ca8a04", "#16a34a", "#0891b2", "#c2410c"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading productivity dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title">
              Productivity Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your productivity boards and track your progress
            </p>
          </div>

          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-board">
            <Plus className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-total-boards">
                    {stats.totalBoards || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Boards</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <List className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-total-items">
                    {stats.totalItems || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-due-items">
                    {stats.itemsDueThisWeek || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Due This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-completion-rate">
                    {stats.completionRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48" data-testid="select-filter-type">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="anomalies">Anomalies</SelectItem>
                <SelectItem value="patterns">Patterns</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
              data-testid="button-grid-view"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              data-testid="button-list-view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Boards Content */}
      <div className="p-6">
        {filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              {boards.length === 0 ? "No boards yet" : "No boards found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {boards.length === 0 
                ? "Create your first productivity board to get started" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {boards.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-board">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Board
              </Button>
            )}
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {filteredBoards.map((board: ProductivityBoard) => (
              <Card 
                key={board.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${view === "list" ? "flex" : ""}`}
                data-testid={`board-card-${board.id}`}
              >
                <Link href={`/productivity/boards/${board.id}`} className="block">
                  <CardHeader className={view === "list" ? "flex-1" : ""}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: board.color }}
                        />
                        <div>
                          <CardTitle className="text-lg" data-testid={`board-title-${board.id}`}>
                            {board.title}
                          </CardTitle>
                          {board.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {board.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.preventDefault()}
                            data-testid={`board-menu-${board.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/productivity/boards/${board.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Open Board
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteBoard(board.id, board.title);
                            }}
                            data-testid={`delete-board-${board.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Link>
                
                <CardContent className={view === "list" ? "flex items-center space-x-4" : ""}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" data-testid={`board-type-${board.id}`}>
                        {boardTypeLabels[board.boardType as keyof typeof boardTypeLabels]}
                      </Badge>
                      {board.isPublic && (
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500" data-testid={`board-date-${board.id}`}>
                      {formatDate(board.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md" data-testid="create-board-dialog">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Board Title *</Label>
              <Input
                id="title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board title..."
                data-testid="input-new-board-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Enter board description..."
                rows={3}
                data-testid="input-new-board-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Board Type</Label>
              <Select value={newBoardType} onValueChange={setNewBoardType}>
                <SelectTrigger data-testid="select-new-board-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="anomalies">Anomalies</SelectItem>
                  <SelectItem value="patterns">Patterns</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Board Color</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: newBoardColor }}
                />
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-300 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => setNewBoardColor(color)}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBoard}
                disabled={createBoardMutation.isPending}
                data-testid="button-create-board-confirm"
              >
                {createBoardMutation.isPending ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}