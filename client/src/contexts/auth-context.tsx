// Auth context is no longer needed with Replit Auth - useAuth hook provides everything
// This file is kept for backward compatibility during migration
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
