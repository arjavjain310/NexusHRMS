import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Organization and system configuration" />
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Company profile and branding</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Configure organization name, timezone, and logo in Supabase + admin panel.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>OpenRouter, Supabase, and Vercel</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>OPENROUTER_RESUME_API_KEY — Resume screening & embeddings</p>
            <p>OPENROUTER_CHAT_API_KEY — AI assistant & voice interview</p>
            <p>DATABASE_URL / DIRECT_URL — Neon PostgreSQL</p>
            <p>NEXT_PUBLIC_SUPABASE_* — Optional auth & storage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
