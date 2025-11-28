import { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider, isMockMode } from "./firebase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock User for Demo Mode
const MOCK_USER: any = {
  uid: "mock-user-123",
  displayName: "Demo User",
  email: "demo@example.com",
  photoURL: "https://github.com/shadcn.png"
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const mockMode = isMockMode();

  useEffect(() => {
    if (mockMode) {
      const timer = setTimeout(() => {
        const hasSession = localStorage.getItem("mock_session");
        if (hasSession) setUser(MOCK_USER);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.warn("Firebase auth check failed:", error);
      setLoading(false);
    }
  }, [mockMode]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      if (fbUser) {
        // Create/get user in backend
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          }),
        });
        
        toast({ title: "Welcome!", description: `Logged in as ${fbUser.email}` });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setLoading(false);
      toast({ 
        title: "Error", 
        description: error?.message || "Could not sign in with Google",
        variant: "destructive" 
      });
    }
  };

  const signOut = async () => {
    try {
      if (mockMode || localStorage.getItem("mock_session")) {
        localStorage.removeItem("mock_session");
        setUser(null);
        toast({ title: "Signed out", description: "See you next time!" });
        return;
      }

      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isMock: mockMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
