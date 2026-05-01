import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

        if (data.user) {
          const ageNum = age ? Number(age) : null;
          await supabase.from("Profiles").upsert(
            { id: data.user.id, name, age: ageNum, gender: gender || null, role: "user" },
            { onConflict: "id" },
          );
        }

        if (data.session) {
          setInfo("A quiet space has been prepared for you.");
        } else {
          setInfo("A quiet space has been prepared for you. Please verify your email.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
            setError("We don't recognise this. Please create an account first.");
            setMode("signup");
            return;
          }
          throw error;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went quiet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-[oklch(0.6_0.08_60)] opacity-[0.08] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-12 text-center">
          <p className="smallcaps text-muted-foreground">MindHaven</p>
          <h1 className="mt-4 font-display text-4xl italic text-ink">
            {mode === "login" ? "Welcome back." : "Begin, gently."}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "login"
              ? "Your thoughts remain yours."
              : "Nothing here is rushed. You may begin when ready."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <>
              <Field label="Your name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="quiet-input" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age">
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="quiet-input"
                  />
                </Field>
                <Field label="Gender">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="quiet-input">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </>
          )}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="quiet-input" />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="quiet-input"
            />
          </Field>

          {error && <p className="text-sm italic text-destructive/90 animate-fade-in">{error}</p>}
          {info && (
            <p className="border-l-2 border-primary/50 pl-4 text-sm italic text-foreground/80 animate-fade-in">
              {info}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-none border border-border bg-transparent font-sans text-sm font-normal tracking-[0.18em] uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {loading ? "One moment…" : mode === "login" ? "Enter" : "Prepare my space"}
          </Button>
        </form>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="text-xs italic text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {mode === "login" ? "I don't have an account yet" : "I already have an account"}
          </button>
        </div>
      </div>

      <style>{`
        .quiet-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--color-border) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          font-family: var(--font-display);
          font-size: 1.05rem;
          height: 2.5rem;
        }
        .quiet-input:focus, .quiet-input:focus-visible {
          outline: none !important;
          border-bottom-color: var(--lamp) !important;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="smallcaps text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
