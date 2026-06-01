"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles } from "lucide-react";
export function ResumeScreeningClient() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("Full Stack Developer with React, TypeScript, Node.js, and PostgreSQL experience. 3+ years required.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  async function handleScreen() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobDescription", jobDescription);
    const res = await fetch("/api/ai/resume-screening", {
      method: "POST",
      body: formData
    });
    const json = await res.json();
    setResult(json.data);
    setLoading(false);
  }
  return <div>
      <PageHeader title="AI Resume Screening" description="Upload resumes for skill extraction, semantic matching, and auto-shortlisting" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById("resume-input").click()}>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "PDF or DOCX — click to upload"}
              </p>
              <input id="resume-input" type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files[0] || null)} />
            </div>

            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea rows={6} value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
            </div>

            <Button onClick={handleScreen} disabled={!file || loading} className="w-full">
              <Sparkles className="h-4 w-4" />
              {loading ? "Analyzing..." : "Screen with AI"}
            </Button>
          </CardContent>
        </Card>

        {result && <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Screening Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-semibold">{result.name}</p>
                <p className="text-sm text-muted-foreground">{result.email}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">AI Match Score</span>
                  <span className="text-2xl font-bold text-primary">{result.aiScore}%</span>
                </div>
                <Progress value={result.aiScore} />
                {result.aiScore >= 70 && <Badge variant="success" className="mt-2">
                    Auto-Shortlisted
                  </Badge>}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Skills Detected</p>
                <div className="flex flex-wrap gap-1">
                  {result.skills.map(s => <Badge key={s} variant="secondary">
                      {s}
                    </Badge>)}
                </div>
              </div>

              <p className="text-sm p-3 rounded-lg bg-muted">{result.matchReason}</p>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>}
      </div>
    </div>;
}