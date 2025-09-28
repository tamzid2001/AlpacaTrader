import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client";
import type { Course, CourseEnrollment } from "../schemas/schema";

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
}

export function useCourse(id: string) {
  return useQuery<Course>({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });
}

export function useUserEnrollments(userId: string) {
  return useQuery<(CourseEnrollment & { course: Course })[]>({
    queryKey: ["/api/users", userId, "enrollments"],
    enabled: !!userId,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      const response = await apiRequest("POST", `/api/users/${userId}/enrollments`, { courseId });
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "enrollments"] });
    },
  });
}

export function useSubmitQuizResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: { userId: string; quizId: string; score: number; totalQuestions: number; answers: any[] }) => {
      const response = await apiRequest("POST", "/api/quiz-results", result);
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "quiz-results"] });
    },
  });
}

export function useSupportChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/support/chat", { message });
      return response.json();
    },
  });
}

export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: async (message: { name: string; email: string; subject: string; message: string; userId?: string }) => {
      const response = await apiRequest("POST", "/api/support/message", message);
      return response.json();
    },
  });
}
