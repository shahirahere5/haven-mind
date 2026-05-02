import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
        <div className="absolute left-1/2 top-1/4 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full bg-[oklch(0.5_0.06_55)] opacity-[0.06] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-16 text-center">
          <p className="smallcaps text-muted-foreground/40">MindHaven</p>
          <h1 className="mt-6 font-display text-5xl italic text-ink leading-[1.1]">
            {mode === "login" ? "Welcome back." : "Begin, gently."}
          </h1>
          <p className="mt-4 text-sm italic text-muted-foreground/50" style={{ lineHeight: "1.8" }}>
            {mode === "login"
              ? "Your thoughts remain yours."
              : "Nothing here is rushed."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {mode === "signup" && (
            <>
              <Field label="Your name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="editorial-input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-8">
                <Field label="Age">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="editorial-input"
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="editorial-input"
                    required
                  >
                    <option value="">—</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </Field>
              </div>
            </>
          )}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="editorial-input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="editorial-input"
            />
          </Field>

          {error && <p className="text-sm italic text-destructive/60 animate-fade-in">{error}</p>}
          {info && (
            <p className="text-sm italic text-foreground/50 animate-fade-in">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full smallcaps py-3 text-foreground/80 transition-all duration-500 hover:text-lamp disabled:text-muted-foreground/30"
          >
            {loading ? "One moment…" : mode === "login" ? "Enter" : "Prepare my space"}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="text-xs italic text-muted-foreground/40 transition-all duration-500 hover:text-foreground/70"
          >
            {mode === "login" ? "I don't have an account yet" : "I already have an account"}
          </button>
        </div>
      </div>

      <style>{`
        .editorial-input {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border);
          border-radius: 0;
          box-shadow: none;
          padding: 0.5rem 0;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--ink);
          outline: none;
          caret-color: var(--lamp);
          transition: border-color 500ms;
        }
        .editorial-input:focus {
          border-bottom-color: var(--lamp);
        }
        .editorial-input::placeholder {
          color: var(--muted-foreground);
          opacity: 0.4;
        }
        select.editorial-input {
          appearance: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="smallcaps text-muted-foreground/40">{label}</label>
      {children}
    </div>
  );
}
