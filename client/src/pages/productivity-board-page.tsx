import { useRoute } from "wouter";
import { ProductivityBoard } from "@/components/productivity/productivity-board";

export function ProductivityBoardPage() {
  const [, params] = useRoute("/productivity/boards/:boardId");
  
  const boardId = params?.boardId;

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Board ID is required</div>
      </div>
    );
  }

  return <ProductivityBoard boardId={boardId} />;
}