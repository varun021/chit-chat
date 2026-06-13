"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", email: "", password: "" });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(loginData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const loginToast = toast.loading("Authenticating your credentials...");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim(),
        password: loginData.password,
      });

      if (error) throw error;

      toast.success("Welcome back!", { id: loginToast });
      router.push("/chat");
    } catch (error) {
      toast.error(error.message || "Authentication failed.", { id: loginToast });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!signupData.username || !signupData.email || !signupData.password) {
      toast.error("Please fill in all required registration fields.");
      return;
    }
    if (signupData.username.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }
    if (!validateEmail(signupData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const signupToast = toast.loading("Registering secure profile...");

    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email.trim(),
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: signupData.username.trim(),
          },
        },
      });

      if (error) throw error;

      toast.success("Verification link transmitted successfully!", { id: signupToast });
      setSignupData({ username: "", email: "", password: "" });
    } catch (error) {
      toast.error(error.message || "Registration failed.", { id: signupToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main 
      className={cn(
        "min-h-screen w-full flex flex-col md:flex-row transition-all duration-500 ease-in-out bg-background text-foreground select-none",
        activeTab === "signup" && "md:flex-row-reverse"
      )}
    >
      {/* VISUAL HERO PANEL (Left on Login, Right on Signup) */}
      <section className="hidden md:flex w-1/2 relative overflow-hidden bg-muted/20 items-center justify-center p-12 border-x border-border/40">
        {/* Subtle Decorative Ambient Background Elements */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
        
        {/* Minimal Graphic Feature Presentation Card */}
        <div className="max-w-md w-full border border-border/50 bg-background/60 backdrop-blur-md rounded-2xl p-8 shadow-sm space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <ShieldCheck className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
              Encrypted Messaging Ecosystem <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Experience end-to-end cloud synchronization. Your private sessions are fully guarded by standard decentralized cryptographic protocols.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", activeTab === "login" ? "bg-muted-foreground/30" : "bg-primary w-4")} />
          </div>
        </div>
      </section>

      {/* INTERACTIVE INTERFACE AUTH FORM PANEL */}
      <section className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          
          {/* Mobile-Only Header Shield Integration */}
          <header className="space-y-3 text-center md:text-left">
            <div className="md:hidden mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
              <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
              ChitChat
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay connected with your friends and sync your updates in real-time.
            </p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl h-11 mb-6">
              <TabsTrigger value="login" className="rounded-lg text-sm font-medium transition-all py-2">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-sm font-medium transition-all py-2">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN INPUT FLOW */}
            <TabsContent value="login" className="outline-none focus:visible:ring-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-foreground/80">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      disabled={loading}
                      value={loginData.email}
                      className="pl-10 bg-muted/30 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all h-10 text-sm"
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-foreground/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      disabled={loading}
                      value={loginData.password}
                      className="pl-10 bg-muted/30 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all h-10 text-sm"
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </div>

                <Button className="w-full rounded-xl h-10 mt-2 font-medium shadow-sm transition-transform active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP INPUT FLOW */}
            <TabsContent value="signup" className="outline-none focus:visible:ring-0">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-username" className="text-xs font-semibold text-foreground/80">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="signup-username"
                      placeholder="john_doe"
                      disabled={loading}
                      value={signupData.username}
                      className="pl-10 bg-muted/30 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all h-10 text-sm"
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-semibold text-foreground/80">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      disabled={loading}
                      value={signupData.email}
                      className="pl-10 bg-muted/30 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all h-10 text-sm"
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-semibold text-foreground/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      disabled={loading}
                      value={signupData.password}
                      className="pl-10 bg-muted/30 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all h-10 text-sm"
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    />
                  </div>
                </div>

                <Button className="w-full rounded-xl h-10 mt-2 font-medium shadow-sm transition-transform active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}