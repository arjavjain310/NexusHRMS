import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Sparkles, Users, Bot, Mic, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo variant="full" href="/" priority className="h-9" />
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-first HR for next-generation teams
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Modern HRMS built for{" "}
            <span className="text-primary">scale & intelligence</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
            Automate recruitment, attendance, payroll, and performance with an elegant
            enterprise experience inspired by the best in HR tech.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/login">
                Launch Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: "Employee Hub", desc: "Directory, profiles, departments & documents" },
            { icon: Bot, title: "AI Assistant", desc: "HR policies, recruitment & employee support" },
            { icon: Sparkles, title: "Resume AI", desc: "Semantic matching & auto-shortlisting" },
            { icon: Mic, title: "Voice Interviews", desc: "AI questions with sentiment analysis" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card transition-shadow hover:shadow-soft">
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
