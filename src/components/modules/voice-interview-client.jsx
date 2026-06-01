"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
export function VoiceInterviewClient() {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const recognitionRef = useRef(null);
  useEffect(() => {
    fetch("/api/ai/voice-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "generate-questions",
        jobTitle: "Software Engineer",
        skills: ["React", "Communication", "Problem Solving"]
      })
    }).then(r => r.json()).then(j => setQuestions(j.data || []));
  }, []);
  function toggleListening() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript(t => t + "\n[Speech recognition not supported in this browser — type your answer below]");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = event => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(prev => prev + " " + text);
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "analyze",
        transcript,
        jobTitle: "Software Engineer",
        questions
      })
    });
    const json = await res.json();
    setAnalysis(json.data);
  }
  return <div>
      <PageHeader title="AI Voice Interview" description="AI-generated questions, speech-to-text, and communication analysis" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Interview Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, i) => <button key={q.id} type="button" onClick={() => setCurrentQ(i)} className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${currentQ === i ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                <Badge variant="outline" className="mb-1 text-xs">
                  {q.category}
                </Badge>
                <p className="line-clamp-2">{q.question}</p>
              </button>)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {questions[currentQ].question || "Loading..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant={listening ? "destructive" : "default"} onClick={toggleListening}>
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? "Stop Recording" : "Start Recording"}
              </Button>
              <Button variant="outline" onClick={analyzeInterview} disabled={!transcript.trim()}>
                <Sparkles className="h-4 w-4" /> Analyze Interview
              </Button>
            </div>

            <div className="min-h-[200px] rounded-lg border bg-muted/30 p-4 text-sm">
              {transcript || <p className="text-muted-foreground">
                  Your spoken answers will appear here. Use the microphone or type below.
                </p>}
            </div>

            <textarea className="w-full rounded-lg border bg-background p-3 text-sm min-h-[80px]" placeholder="Or type your interview response..." value={transcript} onChange={e => setTranscript(e.target.value)} />
          </CardContent>
        </Card>
      </div>

      {analysis && <Card className="mt-6">
          <CardHeader>
            <CardTitle>Interview Scoring Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[{
            label: "Overall",
            value: analysis.overallScore
          }, {
            label: "Sentiment",
            value: Math.round(analysis.sentimentScore * 100)
          }, {
            label: "Confidence",
            value: Math.round(analysis.confidenceScore * 100)
          }, {
            label: "Communication",
            value: Math.round(analysis.communicationScore * 100)
          }].map(s => <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="font-semibold">{s.value}%</span>
                  </div>
                  <Progress value={s.value} />
                </div>)}
            </div>
            <p className="text-sm mb-4">{analysis.feedback}</p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Highlights</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {analysis.highlights.map(h => <li key={h}>{h}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Improvements</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {analysis.improvements.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
}