import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Sparkles } from "lucide-react";

export default function AuthPage() {
  const { user, signInWithGoogle, loading, isMock } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex flex-col bg-zinc-900 text-white p-12 justify-between relative overflow-hidden">
        {/* Background Abstract Art */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent" />
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
             <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
             <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="2 8" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-xl mb-8">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-zinc-900">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>AIPublish</span>
          </div>
          <h1 className="text-5xl font-serif leading-tight mb-6">
            Turn your ideas into <span className="text-indigo-400 italic">published works</span> at the speed of thought.
          </h1>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              <span>AI Drafting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              <span>Citation Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              <span>Multi-Format Export</span>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <p className="text-zinc-300 italic mb-4">"The architecture of this platform is exactly what modern publishers need. It bridges the gap between raw generation and polished, verifiable content."</p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">EP</div>
              <div>
                <div className="font-semibold text-sm">Elena P.</div>
                <div className="text-xs text-zinc-500">Senior Editor, FuturePress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">Enter your credentials to access your workspace</p>
          </div>

          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className="h-12 font-medium text-base relative overflow-hidden" 
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                   <svg className="mr-2 h-5 w-5" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.0003 20.45c-4.654 0-8.4499-3.7961-8.4499-8.4502 0-4.654 3.7959-8.4499 8.4499-8.4499 2.1045 0 4.1065.7694 5.6868 2.1558l-2.6731 2.6729c-.5434-.5113-1.5859-1.0946-3.0137-1.0946-2.5739 0-4.6727 2.1373-4.6727 4.7158 0 2.5787 2.0988 4.7159 4.6727 4.7159 2.449 0 3.9425-1.5504 4.3185-3.257h-4.3185v-3.7341h7.8662c.0981.596.1521 1.2196.1521 1.868 0 4.6089-3.1837 7.8074-7.9784 7.8074z" fill="currentColor"/></svg>
                   Continue with Google
                </>
              )}
              {isMock && !loading && (
                <span className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl">DEMO</span>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Placeholder for Email Auth (Not implemented in this mock step) */}
            <div className="grid gap-2">
               <Button disabled variant="secondary" className="h-12">
                 Email / Password (Coming Soon)
               </Button>
            </div>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
