import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Brain, Users, Leaf, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  const [loaderDone, setLoaderDone] = useState(false);

  if (loading || !loaderDone) {
    return <PageLoader label="Welcome to MindHaven" minMs={2000} onFinish={() => setLoaderDone(true)} />;
  }

  if (session) {
    return <Navigate to="/dashboard" />;
  }

  return <LandingPage />;
}

function LandingPage() {
  const therapyFormats = [
    {
      icon: Brain,
      title: "Individual",
      description: "One-on-one sessions tailored to your needs",
    },
    {
      icon: Users,
      title: "Group",
      description: "Connect with others in a supportive community",
    },
    {
      icon: Heart,
      title: "Couples",
      description: "Strengthen relationships through guided therapy",
    },
  ];

  const therapyStages = [
    {
      number: "01",
      title: "Assessment",
      description: "Understanding where you are and what you need",
    },
    {
      number: "02",
      title: "Exploration",
      description: "Discovering patterns and root causes",
    },
    {
      number: "03",
      title: "Integration",
      description: "Building new habits and perspectives",
    },
    {
      number: "04",
      title: "Growth",
      description: "Sustained progress and empowerment",
    },
  ];

  const providers = [
    {
      name: "Dr. Sarah Chen",
      specialty: "Anxiety & Trauma",
      experience: "12 years",
      image: "👩‍⚕️",
    },
    {
      name: "Marcus Johnson",
      specialty: "Depression & Life Transitions",
      experience: "8 years",
      image: "👨‍⚕️",
    },
    {
      name: "Elena Rodriguez",
      specialty: "Relationship Counseling",
      experience: "10 years",
      image: "👩‍⚕️",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-glass-border/30 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 sm:px-8 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl gradient-text">
            MindHaven
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline" className="text-sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 animate-fade-in">
            <Leaf className="mx-auto h-12 w-12 text-lamp/60 mb-4" />
            <p className="text-sm font-medium text-lamp/60 mb-4 smallcaps">
              Your Journey to Wellness
            </p>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-ink leading-tight mb-6 animate-fade-in">
            A safe space for growth
          </h1>
          <p className="text-lg text-muted-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Connect with compassionate therapists who understand your journey. Experience evidence-based therapy in a supportive, judgment-free environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/auth">
              <Button className="w-full sm:w-auto px-8 py-3 text-base" style={{ background: "var(--gradient-primary)" }}>
                Get Started
              </Button>
            </Link>
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-base">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="px-6 py-20 sm:px-8 sm:py-32 border-t border-glass-border/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-lamp/60 smallcaps mb-4">Getting Started</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ink mb-6">
              A few steps to begin
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { number: "1", title: "Complete Assessment", icon: "📋" },
              { number: "2", title: "Match with Provider", icon: "🤝" },
              { number: "3", title: "Start Healing", icon: "✨" },
            ].map((step) => (
              <Card key={step.number} className="glass-card p-8 text-center hover:shadow-glow transition-all duration-300">
                <div className="text-5xl mb-4">{step.icon}</div>
                <p className="text-sm text-lamp/60 font-medium mb-2">Step {step.number}</p>
                <h3 className="font-display text-xl text-ink">{step.title}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="px-6 py-20 sm:px-8 sm:py-32 border-t border-glass-border/30 bg-glass/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-lamp/60 smallcaps mb-4">Expert Care</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ink mb-6">
              Meet our providers
            </h2>
            <p className="text-muted-foreground/70 max-w-2xl mx-auto">
              Licensed therapists with years of experience helping people like you achieve mental wellness.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.name} className="glass-card p-8">
                <div className="text-6xl mb-4 text-center">{provider.image}</div>
                <h3 className="font-display text-xl text-ink mb-2">{provider.name}</h3>
                <p className="text-sm text-lamp/60 font-medium mb-1">{provider.specialty}</p>
                <p className="text-xs text-muted-foreground/60">{provider.experience} experience</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy Formats */}
      <section className="px-6 py-20 sm:px-8 sm:py-32 border-t border-glass-border/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-lamp/60 smallcaps mb-4">Tailored Approach</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ink mb-6">
              Therapy formats
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {therapyFormats.map((format) => {
              const Icon = format.icon;
              return (
                <Card key={format.title} className="glass-card p-8 hover:shadow-glow transition-all duration-300">
                  <Icon className="h-10 w-10 text-lamp/60 mb-4" />
                  <h3 className="font-display text-2xl text-ink mb-3">{format.title}</h3>
                  <p className="text-muted-foreground/70">{format.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Therapy Journey Stages */}
      <section className="px-6 py-20 sm:px-8 sm:py-32 border-t border-glass-border/30 bg-glass/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-lamp/60 smallcaps mb-4">Your Path Forward</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ink mb-6">
              The stages of therapy
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {therapyStages.map((stage) => (
              <Card key={stage.number} className="glass-card p-6">
                <div className="font-display text-5xl text-lamp/30 mb-4">{stage.number}</div>
                <h3 className="font-display text-xl text-ink mb-3">{stage.title}</h3>
                <p className="text-sm text-muted-foreground/70">{stage.description}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground/70 mb-6 max-w-2xl mx-auto">
              Every person's journey is unique. Our therapists work with you at your own pace, celebrating progress and supporting growth at every stage.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 sm:px-8 sm:py-32 border-t border-glass-border/30">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl sm:text-5xl text-ink mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-lg text-muted-foreground/70 mb-8">
            Take the first step toward better mental health today. It&apos;s never too late to invest in yourself.
          </p>
          <Link to="/auth">
            <Button className="px-8 py-3 text-base" style={{ background: "var(--gradient-primary)" }}>
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border/30 px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pb-8 border-b border-glass-border/30">
            <Link to="/" className="font-display text-xl gradient-text">
              MindHaven
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground/60">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="pt-8 text-center text-xs text-muted-foreground/50">
            <p>© 2026 MindHaven. All rights reserved.</p>
            <p className="mt-2">
              Not a therapist or medical professional · For emergencies, contact your local mental health service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
