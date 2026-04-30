import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;

        // Upsert profile with full details (id = auth.uid())
        if (data.user) {
          const ageNum = age ? Number(age) : null;
          await supabase.from("Profiles").upsert(
            {
              id: data.user.id,
              name,
              age: ageNum,
              gender: gender || null,
              role: "user",
            },
            { onConflict: "id" },
          );
        }

        if (data.session) {
          // Auto-logged in
          setInfo("Welcome to MindHaven 💛 Check your email to verify your account.");
        } else {
          setInfo("Check your email to verify your account ✉️");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
            setError("No account found with these details. Please sign up first.");
            setMode("signup");
            return;
          }
          throw error;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[oklch(0.85_0.1_295)] opacity-40 blur-3xl animate-float" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[oklch(0.88_0.08_50)] opacity-40 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>
      <Card className="relative w-full max-w-md border-0 shadow-glow glass animate-rise">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl animate-float">🌸</div>
          <CardTitle className="font-display text-4xl font-semibold tracking-tight text-gradient">
            MindHaven
          </CardTitle>
          <CardDescription className="text-base">
            {mode === "login"
              ? "Welcome back. Your thoughts are safe here."
              : "A safe space for your thoughts. Take your time."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
            {info && (
              <p className="rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground animate-fade-in">
                {info}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full gradient-primary shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create my space"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="mt-4 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
