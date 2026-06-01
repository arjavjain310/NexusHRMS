"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
const SUGGESTIONS = ["How do I approve leave requests?", "What's our interview scheduling process?", "Explain resume AI screening", "Help draft an offer letter outline"];
export function AIAssistantClient() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hello! I'm Nexus AI, your HR assistant. I can help with recruitment, policies, leave, payroll, and interview scheduling. How can I help you today?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  async function send(content) {
    const text = content || input.trim();
    if (!text || loading) return;
    const userMsg = {
      role: "user",
      content: text
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: newMessages
      })
    });
    const json = await res.json();
    setMessages([...newMessages, {
      role: "assistant",
      content: json.data.content || "Sorry, I couldn't respond."
    }]);
    setLoading(false);
  }
  return <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="AI HR Assistant" description="Recruitment support, HR policies, and employee queries — powered by AI" />

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>}
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {m.content}
              </div>
              {m.role === "user" && <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>}
            </div>)}
          {loading && <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => send(s)} className="text-xs rounded-full border px-3 py-1.5 hover:bg-muted transition-colors">
                {s}
              </button>)}
          </div>
          <div className="flex gap-2">
            <Textarea placeholder="Ask about HR policies, recruitment, leave..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }} rows={2} className="resize-none" />
            <Button size="icon" className="h-auto shrink-0" onClick={() => send()} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>;
}