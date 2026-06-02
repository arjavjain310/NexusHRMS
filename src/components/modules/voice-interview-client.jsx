"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  INTERVIEWERS,
  INTERVIEW_LENGTHS,
} from "@/lib/voice-interview-config";
import { Mic, MicOff, Sparkles, Volume2, Play, Loader2 } from "lucide-react";

function pickSpeechVoice(preferMale) {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis?.getVoices() || [];
  if (!voices.length) return null;
  const maleRe = /male|david|james|daniel|mark|guy|google uk english male/i;
  const femaleRe = /female|samantha|victoria|zira|karen|susan|google uk english female/i;
  const re = preferMale ? maleRe : femaleRe;
  return voices.find((v) => re.test(v.name)) || voices[0];
}

export function VoiceInterviewClient() {
  const [phase, setPhase] = useState("setup");
  const [interviewerId, setInterviewerId] = useState("arjav");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [lengthId, setLengthId] = useState("standard");
  const [readAloud, setReadAloud] = useState(true);
  const [starting, setStarting] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const recognitionRef = useRef(null);

  const interviewer =
    INTERVIEWERS.find((i) => i.id === interviewerId) || INTERVIEWERS[0];
  const questionCount =
    INTERVIEW_LENGTHS.find((l) => l.id === lengthId)?.count || 5;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => window.speechSynthesis?.getVoices();
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  const speakQuestion = useCallback(
    (text) => {
      if (!readAloud || !text || typeof window === "undefined") return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickSpeechVoice(interviewer.preferMaleVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [readAloud, interviewer.preferMaleVoice]
  );

  useEffect(() => {
    if (phase !== "active" || !questions.length) return;
    const q = questions[currentQ]?.question;
    if (q) speakQuestion(q);
  }, [phase, currentQ, questions, speakQuestion]);

  async function handleResumeFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    if (file.name.endsWith(".txt")) {
      const text = await file.text();
      setResumeText(text.slice(0, 15000));
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/ai/voice-interview", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (json.data?.text) setResumeText(json.data.text);
      else setSetupError("Could not read resume file.");
    } catch {
      setSetupError("Failed to upload resume.");
    }
  }

  async function beginInterview() {
    if (!jobTitle.trim()) {
      setSetupError("Please enter the role you are practicing for.");
      return;
    }
    setSetupError(null);
    setStarting(true);
    setAnalysis(null);
    setTranscript("");
    setCurrentQ(0);
    try {
      const res = await fetch("/api/ai/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-questions",
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          resumeText: resumeText.trim(),
          count: questionCount,
          skills: [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSetupError(json.error || "Could not generate questions.");
        return;
      }
      const list = json.data || [];
      if (!list.length) {
        setSetupError("No questions generated. Try again.");
        return;
      }
      setQuestions(list);
      setPhase("active");
    } catch {
      setSetupError("Network error. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function toggleListening() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript(
        (t) => t + "\n[Speech recognition not supported — type your answer below]"
      );
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript((prev) => `${prev} ${text}`.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function analyzeInterview() {
    const res = await fetch("/api/ai/voice-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze",
        transcript,
        jobTitle: jobTitle.trim(),
        questions,
      }),
    });
    const json = await res.json();
    setAnalysis(json.data);
  }

  function resetSetup() {
    window.speechSynthesis?.cancel();
    setPhase("setup");
    setQuestions([]);
    setTranscript("");
    setAnalysis(null);
    setCurrentQ(0);
  }

  if (phase === "setup") {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <PageHeader
          title="Practice Interview"
          description={`${interviewer.name} will guide you through AI-generated questions`}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Choose your interviewer</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {INTERVIEWERS.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setInterviewerId(person.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:border-primary/50",
                  interviewerId === person.id &&
                    "border-primary ring-2 ring-primary/20 bg-primary/5"
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {person.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Upload your resume (optional)</h2>
          <p className="text-sm text-muted-foreground">
            PDF or TXT — questions will align with your experience when provided.
          </p>
          <Input type="file" accept=".pdf,.txt" onChange={handleResumeFile} />
          {resumeFileName && (
            <p className="text-xs text-muted-foreground">Selected: {resumeFileName}</p>
          )}
        </section>

        <section className="space-y-2">
          <Label htmlFor="jobTitle">
            3. Role you are practicing for <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Data Analyst, Software Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </section>

        <section className="space-y-2">
          <Label htmlFor="jobDesc">4. Job description (optional)</Label>
          <Textarea
            id="jobDesc"
            placeholder="Paste the job posting or key requirements..."
            className="min-h-[100px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Interview length</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INTERVIEW_LENGTHS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLengthId(opt.id)}
                className={cn(
                  "rounded-lg border p-3 text-center transition-colors",
                  lengthId === opt.id && "border-primary bg-primary/10"
                )}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.count} questions</p>
              </button>
            ))}
          </div>
        </section>

        {setupError && (
          <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            {setupError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={beginInterview} disabled={starting}>
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Begin interview with {interviewer.name}
          </Button>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={readAloud}
              onChange={(e) => setReadAloud(e.target.checked)}
              className="rounded border-input"
            />
            Read questions aloud (browser)
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Interview with ${interviewer.name}`}
        description={`${jobTitle} · Question ${currentQ + 1} of ${questions.length}`}
        action={
          <Button variant="outline" onClick={resetSetup}>
            New setup
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {interviewer.initials}
                </AvatarFallback>
              </Avatar>
              {interviewer.name}&apos;s questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, i) => (
              <button
                key={q.id || i}
                type="button"
                onClick={() => setCurrentQ(i)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 text-sm transition-colors",
                  currentQ === i ? "border-primary bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Badge variant="outline" className="mb-1 text-xs">
                  {q.category}
                </Badge>
                <p className="line-clamp-2">{q.question}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {questions[currentQ]?.question || "Loading..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={listening ? "destructive" : "default"}
                onClick={toggleListening}
              >
                {listening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {listening ? "Stop recording" : "Start recording"}
              </Button>
              <Button
                variant="outline"
                onClick={() => speakQuestion(questions[currentQ]?.question)}
              >
                <Volume2 className="h-4 w-4" /> Hear again
              </Button>
              <Button
                variant="outline"
                disabled={currentQ >= questions.length - 1}
                onClick={() => setCurrentQ((c) => c + 1)}
              >
                Next question
              </Button>
              <Button
                variant="outline"
                onClick={analyzeInterview}
                disabled={!transcript.trim()}
              >
                <Sparkles className="h-4 w-4" /> Analyze interview
              </Button>
            </div>

            <div className="min-h-[200px] rounded-lg border bg-muted/30 p-4 text-sm">
              {transcript || (
                <p className="text-muted-foreground">
                  Your spoken answers appear here. {interviewer.name} asked the
                  question above — respond via microphone or type below.
                </p>
              )}
            </div>

            <textarea
              className="w-full rounded-lg border bg-background p-3 text-sm min-h-[80px]"
              placeholder="Or type your interview response..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Interview scoring — feedback from {interviewer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[
                { label: "Overall", value: analysis.overallScore },
                { label: "Sentiment", value: Math.round(analysis.sentimentScore * 100) },
                { label: "Confidence", value: Math.round(analysis.confidenceScore * 100) },
                {
                  label: "Communication",
                  value: Math.round(analysis.communicationScore * 100),
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="font-semibold">{s.value}%</span>
                  </div>
                  <Progress value={s.value} />
                </div>
              ))}
            </div>
            <p className="text-sm mb-4">{analysis.feedback}</p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Highlights</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {(analysis.highlights || []).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Improvements</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {(analysis.improvements || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
