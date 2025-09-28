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
    <div className="h-full bg-[#f6f8fc] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-[#e1e5ea] dark:border-gray-700 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#323338] dark:text-gray-100 mb-2" data-testid="page-title">
              Main workspace
            </h1>
            <p className="text-[#676879] dark:text-gray-400 text-lg">
              Work management • Manage all your work in one place
            </p>
          </div>

          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-[#0073ea] hover:bg-[#0060c2] text-white font-medium px-6 py-3 rounded-lg border-0 shadow-sm transition-colors"
            data-testid="button-create-board"
          >
            <Plus className="w-5 h-5 mr-2" />
            New board
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 border border-[#e1e5ea] shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#0073ea] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Grid className="w-6 h-6 text-[#0073ea]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#323338]" data-testid="stat-total-boards">
                  {stats.totalBoards || 0}
                </div>
                <div className="text-sm text-[#676879] font-medium">Boards</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#e1e5ea] shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#00c875] bg-opacity-10 rounded-lg flex items-center justify-center">
                <List className="w-6 h-6 text-[#00c875]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#323338]" data-testid="stat-total-items">
                  {stats.totalItems || 0}
                </div>
                <div className="text-sm text-[#676879] font-medium">Items</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#e1e5ea] shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#ff9500] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#ff9500]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#323338]" data-testid="stat-due-items">
                  {stats.itemsDueThisWeek || 0}
                </div>
                <div className="text-sm text-[#676879] font-medium">Due this week</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#e1e5ea] shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#784bd1] bg-opacity-10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#784bd1]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#323338]" data-testid="stat-completion-rate">
                  {stats.completionRate || 0}%
                </div>
                <div className="text-sm text-[#676879] font-medium">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="px-8 py-6 bg-white dark:bg-gray-800 border-b border-[#e1e5ea] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#676879] w-5 h-5" />
              <Input
                placeholder="Search for boards, items, or anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 w-80 border-[#c4c4c4] rounded-lg text-[#323338] placeholder:text-[#9699a6] bg-white focus:border-[#0073ea] focus:ring-2 focus:ring-[#0073ea] focus:ring-opacity-20"
                data-testid="input-search"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-52 py-3 border-[#c4c4c4] rounded-lg text-[#323338] bg-white hover:border-[#0073ea] transition-colors" data-testid="select-filter-type">
                <Filter className="w-4 h-4 mr-2 text-[#676879]" />
                <SelectValue placeholder="All board types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All board types</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="anomalies">Anomalies</SelectItem>
                <SelectItem value="patterns">Patterns</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-[#f6f8fc] rounded-lg p-1">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              className={view === "grid" ? "bg-white shadow-sm text-[#323338] hover:bg-white" : "text-[#676879] hover:text-[#323338] hover:bg-white"}
              data-testid="button-grid-view"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className={view === "list" ? "bg-white shadow-sm text-[#323338] hover:bg-white" : "text-[#676879] hover:text-[#323338] hover:bg-white"}
              data-testid="button-list-view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Boards Content */}
      <div className="p-8">
        {filteredBoards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-[#f6f8fc] rounded-full flex items-center justify-center mb-6">
              <Grid className="w-12 h-12 text-[#c4c4c4]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#323338] dark:text-gray-100 mb-3">
              {boards.length === 0 ? "No boards yet" : "No boards found"}
            </h3>
            <p className="text-[#676879] dark:text-gray-400 mb-8 text-lg">
              {boards.length === 0 
                ? "Create your first board to get started organizing your work" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {boards.length === 0 && (
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                className="bg-[#0073ea] hover:bg-[#0060c2] text-white font-medium px-8 py-4 rounded-lg border-0 text-lg"
                data-testid="button-create-first-board"
              >
                <Plus className="w-5 h-5 mr-3" />
                Create your first board
              </Button>
            )}
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
            {filteredBoards.map((board: ProductivityBoard) => (
              <div 
                key={board.id} 
                className={`bg-white rounded-xl border border-[#e1e5ea] hover:shadow-lg transition-all duration-200 cursor-pointer group ${view === "list" ? "flex items-center p-4" : ""}`}
                data-testid={`board-card-${board.id}`}
              >
                <Link href={`/productivity/boards/${board.id}`} className="block w-full">
                  <div className={view === "list" ? "flex items-center justify-between flex-1" : "p-6"}>
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-6 h-6 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: board.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-[#323338] group-hover:text-[#0073ea] transition-colors truncate" data-testid={`board-title-${board.id}`}>
                          {board.title}
                        </h3>
                        {board.description && view === "grid" && (
                          <p className="text-sm text-[#676879] mt-2 line-clamp-2">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {view === "grid" && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f6f8fc] text-[#676879] border border-[#e1e5ea]" data-testid={`board-type-${board.id}`}>
                            {boardTypeLabels[board.boardType as keyof typeof boardTypeLabels]}
                          </span>
                          {board.isPublic && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8f4fd] text-[#0073ea] border border-[#c7e5ff]">
                              <Users className="w-3 h-3 mr-1" />
                              Shared
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#9699a6]" data-testid={`board-date-${board.id}`}>
                          {formatDate(board.updatedAt)}
                        </div>
                      </div>
                    )}

                    {view === "list" && (
                      <div className="flex items-center space-x-4 ml-auto">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f6f8fc] text-[#676879] border border-[#e1e5ea]" data-testid={`board-type-${board.id}`}>
                          {boardTypeLabels[board.boardType as keyof typeof boardTypeLabels]}
                        </span>
                        <div className="text-sm text-[#9699a6]" data-testid={`board-date-${board.id}`}>
                          {formatDate(board.updatedAt)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.preventDefault()}
                              className="text-[#676879] hover:text-[#323338] hover:bg-[#f6f8fc]"
                              data-testid={`board-menu-${board.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/productivity/boards/${board.id}`;
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Open Board
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
                    )}
                  </div>
                </Link>
              </div>
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