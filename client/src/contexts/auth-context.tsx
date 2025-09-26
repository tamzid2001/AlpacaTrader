import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result on page load
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          // Handle successful Google sign-in
        }
      })
      .catch((error) => {
        console.error("Redirect result error:", error);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Sync user with backend
          const userData = {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            photoURL: firebaseUser.photoURL,
            role: "student",
            isApproved: false,
          };

          const response = await apiRequest("POST", "/api/auth/sync-user", userData);
          const backendUser = await response.json();
          setUser(backendUser);
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isApproved = user?.isApproved || false;

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, isApproved }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
