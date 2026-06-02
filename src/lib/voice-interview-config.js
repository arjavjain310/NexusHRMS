/** Practice interview hosts — Arjav is the default male-voice interviewer */
export const INTERVIEWERS = [
  {
    id: "arjav",
    name: "Arjav",
    initials: "AJ",
    description:
      "Professional tone; browser reads questions in a male-style voice when available.",
    preferMaleVoice: true,
  },
  {
    id: "carie",
    name: "Carie",
    initials: "CL",
    description:
      "Supportive tone; browser reads questions in a female-style voice when available.",
    preferMaleVoice: false,
  },
];

export const INTERVIEW_LENGTHS = [
  { id: "short", label: "Short", count: 3 },
  { id: "standard", label: "Standard", count: 5 },
  { id: "long", label: "Long", count: 7 },
  { id: "extended", label: "Extended", count: 10 },
];
