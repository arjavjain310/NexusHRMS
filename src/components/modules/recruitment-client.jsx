"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileSearch, Mic } from "lucide-react";
export function RecruitmentClient() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  useEffect(() => {
    fetch("/api/recruitment").then(r => r.json()).then(j => {
      setJobs(j.data.jobs || []);
      setCandidates(j.data.candidates || []);
    });
  }, []);
  return <div>
      <PageHeader title="Recruitment" description="Job posts, candidate pipeline, and AI-powered hiring" action={<div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/recruitment/resume-screening">
                <FileSearch className="h-4 w-4" /> Resume AI
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recruitment/voice-interview">
                <Mic className="h-4 w-4" /> Voice Interview
              </Link>
            </Button>
          </div>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {jobs.map(job => <Card key={job.id}>
            <CardHeader>
              <CardTitle className="text-lg">{job.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {job._count.candidates || 0} candidates
              </p>
              <Badge className="mt-2" variant={job.isActive ? "success" : "secondary"}>
                {job.isActive ? "Active" : "Closed"}
              </Badge>
            </CardContent>
          </Card>)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline (AI Ranked)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.map(c => <div key={c.id} className="flex flex-col sm:flex-row gap-4 rounded-lg border p-4">
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(c.skills || []).map(s => <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>)}
                </div>
              </div>
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-sm mb-1">
                  <span>AI Match</span>
                  <span className="font-semibold text-primary">{c.aiScore}%</span>
                </div>
                <Progress value={c.aiScore} />
                <Badge className="mt-2" variant="outline">
                  {c.status}
                </Badge>
              </div>
            </div>)}
        </CardContent>
      </Card>
    </div>;
}