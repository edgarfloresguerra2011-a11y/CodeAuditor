import { createContext, ReactNode, useContext } from "react";

// USUARIO FALSO PARA ENTRAR DIRECTO
const MOCK_USER = {
  id: 1,
  username: "admin",
  displayName: "Admin CodeAuditor",
  email: "admin@demo.com",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  isAdmin: true,
  role: "admin"
};

type AuthContextType = {
  user: any;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user: MOCK_USER, // SIEMPRE LOGUEADO
        isLoading: false,
        error: null,
        loginMutation: { mutateAsync: async () => console.log("Login Simulado") },
        logoutMutation: { mutate: () => console.log("Logout Simulado") },
        registerMutation: { mutateAsync: async () => console.log("Registro Simulado") },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: MOCK_USER, isLoading: false }; // Fallback seguro
  }
  return context;
}
