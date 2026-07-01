"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/services/apiClient";
import {
  History,
  Calendar,
  Mail,
  FileText,
  User,
  MapPin,
  Heart,
  TrendingUp,
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  Brain,
  ShieldCheck,
  Send,
  Loader2,
  Trash2,
  Check,
  Search,
  CheckSquare,
  DollarSign
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "meeting" | "email" | "diligence" | "note";
  title: string;
  date: string;
  description: string;
  author: string;
  tags?: string[];
}

interface ActionItem {
  task: string;
  status: "pending" | "completed";
}

interface Meeting {
  id: string;
  date: string;
  duration: string;
  summary: string;
  sentiment: string;
  interestLevel: string;
  interestScore: number;
  concerns: string[];
  questions: string[];
  nextSteps: string[];
  actionItems: ActionItem[];
  transcript?: string;
}

interface Recommendation {
  id: string;
  next_best_actions: string[];
  priority: string;
  reason: string;
  deadline: string;
}

interface NoteItem {
  id: number;
  content: string;
  createdAt: string;
}

interface Reminder {
  id: number;
  title: string;
  dueDate: string;
  status: string;
}

interface EmailItem {
  id: string;
  subject: string;
  body: string;
  tone: string;
  type: string;
  status: string;
}

interface InvestorDetail {
  id: string;
  name: string;
  firm: string;
  role: string;
  status: string;
  lastContact: string;
  location: string;
  typicalCheck: string;
  preferences: string[];
  notes: string;
  interestScore: number;
  meetings: Meeting[];
  recommendations: Recommendation[];
  notesList: NoteItem[];
  reminders: Reminder[];
  emails: EmailItem[];
  timeline: TimelineEvent[];
  tasks: ActionItem[];
}

const MOCK_DETAILS: Record<string, InvestorDetail> = {
  p1: {
    id: "p1",
    name: "Kunal Bahl",
    firm: "Titan Capital",
    role: "Co-Founder & Partner",
    status: "Active Diligence",
    lastContact: "Today",
    location: "New Delhi, India",
    typicalCheck: "₹25L - ₹1.5Cr",
    preferences: ["Developer Tools", "AI First SaaS", "No warm intro required"],
    notes: "Keen interest in automated CRM updates and custom workflow builders.",
    interestScore: 88,
    meetings: [
      {
        id: "m1_kunal",
        date: "June 27, 2026",
        duration: "30 mins",
        summary: "Discussed custom CRM integrations and workflow auto-generation using Gemini models. Kunal liked the product speed.",
        sentiment: "Highly Engaged",
        interestLevel: "High",
        interestScore: 88,
        concerns: ["Database sync performance bottlenecks"],
        questions: ["Can we customize the schema mapping per investor?"],
        nextSteps: ["Send custom sandbox credentials"],
        actionItems: [{ task: "Send custom sandbox credentials", status: "pending" }]
      }
    ],
    recommendations: [
      {
        id: "r1_kunal",
        next_best_actions: ["Provision a sandboxed developer instance and invite Titan Capital engineers."],
        priority: "High",
        reason: "Kunal is technical and wants to verify platform extensibility before proceeding.",
        deadline: "Next week"
      }
    ],
    notesList: [
      { id: 1, content: "Kunal prefers concise email communication.", createdAt: "2026-06-27T10:00:00Z" }
    ],
    reminders: [
      { id: 1, title: "Follow up with sandbox invite", dueDate: "June 29, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_kunal", type: "meeting", title: "SAFE Alignment Meeting", date: "Today", description: "Focused on technical pipeline extensibility and custom layouts.", author: "Jane Doe", tags: ["Meeting", "Tech Dev"] }
    ],
    tasks: [{ task: "Send custom sandbox credentials", status: "pending" }]
  },
  p2: {
    id: "p2",
    name: "Vani Kola",
    firm: "Kalaari Capital",
    role: "Managing Director",
    status: "Soft Committed",
    lastContact: "Yesterday",
    location: "Bengaluru, India",
    typicalCheck: "₹2Cr - ₹8Cr",
    preferences: ["Generative AI", "Enterprise SaaS", "Prefers early traction stats"],
    notes: "Soft committed ₹1.5Cr on standard pre-seed terms.",
    interestScore: 92,
    meetings: [
      {
        id: "m1_vani",
        date: "June 26, 2026",
        duration: "45 mins",
        summary: "Discussed market size and SaaS scaling inside India. Vani Kola expressed interest in leading the pre-seed round with a soft commitment.",
        sentiment: "Engaged",
        interestLevel: "High",
        interestScore: 92,
        concerns: ["Fierce competition in AI CRM tools market segment"],
        questions: ["What is your long-term defensive moat against HubSpot and Salesforce?"],
        nextSteps: ["Send updated competitor matrix and market sizing slide"],
        actionItems: [{ task: "Send updated competitor matrix and market sizing slide", status: "pending" }]
      }
    ],
    recommendations: [
      {
        id: "r1_vani",
        next_best_actions: ["Draft and share the competitive analysis report highlighting proprietary vector matching pipelines."],
        priority: "High",
        reason: "Vani Kola requires validation of long-term moat before executing the commitment sheet.",
        deadline: "Next week"
      }
    ],
    notesList: [
      { id: 1, content: "Kalaari likes early enterprise traction stats.", createdAt: "2026-06-26T14:30:00Z" }
    ],
    reminders: [
      { id: 1, title: "Prepare competitor matrix slides", dueDate: "June 30, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_vani", type: "meeting", title: "Generative AI CRM Pitch", date: "Yesterday", description: "Focused on SaaS scaling metrics and Kalaari investment thesis alignment.", author: "Jane Doe", tags: ["Meeting", "Traction"] }
    ],
    tasks: [{ task: "Send updated competitor matrix and market sizing slide", status: "pending" }]
  },
  p3: {
    id: "p3",
    name: "Ritesh Agarwal",
    firm: "OYO / Angel Investor",
    role: "Founder & CEO / Angel",
    status: "Soft Committed",
    lastContact: "2 days ago",
    location: "Gurugram, India",
    typicalCheck: "₹10L - ₹50L",
    preferences: ["Hospitality Tech", "B2C AI Agents", "Very fast check writer"],
    notes: "Soft committed ₹30L on standard SAFE agreement.",
    interestScore: 95,
    meetings: [
      {
        id: "m1_ritesh",
        date: "June 25, 2026",
        duration: "30 mins",
        summary: "Quick video pitch. Ritesh immediately saw value in automated follow-ups for outbound business development and soft committed ₹30L.",
        sentiment: "Outstanding",
        interestLevel: "High",
        interestScore: 95,
        concerns: ["SaaS scaling model in Indian market"],
        questions: ["How fast can you onboard 100 portfolio founders?"],
        nextSteps: ["Send pre-seed SAFE documents for signature"],
        actionItems: [{ task: "Send pre-seed SAFE documents for signature", status: "pending" }]
      }
    ],
    recommendations: [
      {
        id: "r1_ritesh",
        next_best_actions: ["Send pre-seed SAFE documents for signature to OYO CEO's office."],
        priority: "Critical",
        reason: "Fast-moving commitment that we want to close within 48 hours.",
        deadline: "June 28, 2026"
      }
    ],
    notesList: [
      { id: 1, content: "Ritesh was extremely bullish on automated email drafts.", createdAt: "2026-06-25T14:00:00Z" }
    ],
    reminders: [
      { id: 1, title: "Prepare SAFE for signature", dueDate: "June 28, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_ritesh", type: "meeting", title: "Introductory Video Sync", date: "2 days ago", description: "Ritesh soft committed ₹30L on the call.", author: "Jane Doe", tags: ["Call", "Commitment"] }
    ],
    tasks: [{ task: "Send pre-seed SAFE documents for signature", status: "pending" }]
  },
  p4: {
    id: "p4",
    name: "Shailendra Singh",
    firm: "Peak XV Partners",
    role: "Managing Director",
    status: "Active Diligence",
    lastContact: "3 days ago",
    location: "Bengaluru, India",
    typicalCheck: "₹8Cr - ₹30Cr",
    preferences: ["Deep Tech", "AI Infrastructure", "Leads Series A/B"],
    notes: "Evaluating for peak XV pre-seed accelerator program.",
    interestScore: 84,
    meetings: [
      {
        id: "m1_shailendra",
        date: "June 24, 2026",
        duration: "45 mins",
        summary: "Introduction call with Peak XV pre-seed accelerator leads. Discussed automated agent workflows and multi-LLM routing configurations.",
        sentiment: "Neutral",
        interestLevel: "Medium",
        interestScore: 84,
        concerns: ["Early developer retention metrics"],
        questions: ["What is your target customer acquisition cost (CAC) once scaling outbound?"],
        nextSteps: ["Send detailed unit economics spreadsheet"],
        actionItems: [{ task: "Send detailed unit economics spreadsheet", status: "pending" }]
      }
    ],
    recommendations: [
      {
        id: "r1_shailendra",
        next_best_actions: ["Prepare and send unit economics calculations and financial model projections."],
        priority: "Medium",
        reason: "Required to proceed to the final accelerator evaluation panel.",
        deadline: "July 2, 2026"
      }
    ],
    notesList: [
      { id: 1, content: "Peak XV requires high conviction in global product market fit.", createdAt: "2026-06-24T16:00:00Z" }
    ],
    reminders: [
      { id: 1, title: "Draft unit economics file", dueDate: "July 2, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_shailendra", type: "meeting", title: "Accelerator Intro Call", date: "3 days ago", description: "Focused on global scaling model and developer acquisition strategies.", author: "Jane Doe", tags: ["Call", "Accelerator"] }
    ],
    tasks: [{ task: "Send detailed unit economics spreadsheet", status: "pending" }]
  },
  p5: {
    id: "p5",
    name: "Alfred Lin",
    firm: "Sequoia Capital",
    role: "Partner",
    status: "Active Diligence",
    lastContact: "June 27, 2026",
    location: "San Francisco, CA",
    typicalCheck: "₹4Cr - ₹16Cr",
    preferences: ["AI Chief of Staff", "Security first", "Likes fast scaling"],
    notes: "Alfred requested pre-seed SAFE drafts and vector storage security details.",
    interestScore: 92,
    meetings: [
      {
        id: "m1_alfred",
        date: "June 27, 2026",
        duration: "30 mins",
        summary: "Jane pitched FounderOS AI. Alfred Lin was highly engaged in the product demo, specifically looking at how the Explanation Agent details check size and sector matching logic. He asked detailed questions regarding pre-seed hard circles, contract storage, and security. He requested a formal follow-up containing the pre-seed safe agreement drafts and pilot developer quotes.",
        sentiment: "Highly Engaged",
        interestLevel: "High",
        interestScore: 92,
        concerns: [
          "Security controls of ChromaDB/Qdrant vector databases parsing confidential pitch information.",
          "User churn if developers do not find the agent integration helpful."
        ],
        questions: [
          "How does the Vector matching algorithm rank relevance?",
          "What checks do you have in place to prevent the LLM from hallucinating?",
          "Are you raising on a standard YC safe agreement?"
        ],
        nextSteps: [
          "Send Alfred pre-seed SAFE agreement drafts & deal terms",
          "Prepare pilot developer quotes and testimonials from 2 active founders",
          "Share the database security whitepaper and vector storage setup"
        ],
        actionItems: [
          { task: "Send Alfred pre-seed SAFE agreement drafts & deal terms", status: "pending" },
          { task: "Prepare pilot developer quotes and testimonials from 2 active founders", status: "pending" },
          { task: "Share the database security whitepaper and vector storage setup", status: "pending" }
        ]
      }
    ],
    recommendations: [
      {
        id: "r1_alfred",
        next_best_actions: [
          "Send the pre-seed SAFE drafts and detailed terms to Alfred Lin.",
          "Provide detailed information regarding vector storage size checking capabilities.",
          "Share the Qdrant architecture detail specifications."
        ],
        priority: "High",
        reason: "Alfred Lin from Sequoia expressed high interest and made specific requests. Promptly addressing these is critical.",
        deadline: "Early July"
      }
    ],
    notesList: [
      { id: 1, content: "Alfred was highly focused on database security controls.", createdAt: "2026-06-27T16:00:00Z" }
    ],
    reminders: [
      { id: 1, title: "Send SAFE drafts to Alfred", dueDate: "June 29, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_alfred", type: "meeting", title: "Partner Diligence Sync", date: "June 27, 2026", description: "Focused on technical diligence and SAFE contract reviews.", author: "Jane Doe", tags: ["Meeting", "Diligence"] }
    ],
    tasks: [
      { task: "Send Alfred pre-seed SAFE agreement drafts & deal terms", status: "pending" },
      { task: "Prepare pilot developer quotes and testimonials from 2 active founders", status: "pending" },
      { task: "Share the database security whitepaper and vector storage setup", status: "pending" }
    ]
  },
  p6: {
    id: "p6",
    name: "Kirsten Green",
    firm: "Forerunner Ventures",
    role: "Founder & Partner",
    status: "Soft Committed",
    lastContact: "June 25, 2026",
    location: "New York, NY",
    typicalCheck: "₹4Cr - ₹12Cr",
    preferences: ["Consumer Enablement", "Transaction SaaS", "Commerce pipelines"],
    notes: "Curious about B2B2C transaction network effect, requested Q3 engineering roadmap.",
    interestScore: 78,
    meetings: [
      {
        id: "m1_kirsten",
        date: "June 25, 2026",
        duration: "45 mins",
        summary: "Initial introduction call. Kirsten Green was curious about how consumer platforms and commerce networks integrate with B2B fundraising platforms. She asked questions regarding our database pipeline sizes, and requested early pilot stats. High alignment with Forerunner's fintech portfolio bets.",
        sentiment: "Engaged",
        interestLevel: "Medium",
        interestScore: 78,
        concerns: [
          "Consumer network effects are hard to establish in pure B2B fundraising platforms.",
          "First-check size requirements matching. Forerunner usually leads series A rather than early pre-seeds."
        ],
        questions: [
          "How do you plan to scale the investor database to keep checks, locations, and stages updated in real time?",
          "What is the current traction of active pilot users on the platform?"
        ],
        nextSteps: [
          "Send Kirsten product demo video link & revised dev roadmap",
          "Schedule follow-up partner sync for early July"
        ],
        actionItems: [
          { task: "Send Kirsten product demo video link & revised dev roadmap", status: "completed" },
          { task: "Schedule follow-up partner sync for early July", status: "pending" }
        ]
      }
    ],
    recommendations: [
      {
        id: "r1_kirsten",
        next_best_actions: [
          "Share the visual product demo video link and revised dev roadmap.",
          "Follow up in early July to schedule the next sync call."
        ],
        priority: "Medium",
        reason: "Kirsten requested these materials to share with her associate pool before a partner meeting.",
        deadline: "Early July"
      }
    ],
    notesList: [
      { id: 1, content: "Kirsten loves B2B2C business model pivots.", createdAt: "2026-06-25T11:00:00Z" }
    ],
    reminders: [
      { id: 1, title: "Send demo video to Kirsten", dueDate: "June 28, 2026", status: "pending" }
    ],
    emails: [],
    timeline: [
      { id: "t1_kirsten", type: "meeting", title: "Introductory Call", date: "June 25, 2026", description: "First intro call to share the high level vision.", author: "Jane Doe", tags: ["Call", "Intro"] }
    ],
    tasks: [
      { task: "Send Kirsten product demo video link & revised dev roadmap", status: "completed" },
      { task: "Schedule follow-up partner sync for early July", status: "pending" }
    ]
  }
};

const getFallbackDetails = (investorId: string, name: string = "Investor Partner"): InvestorDetail => {
  return {
    id: investorId,
    name: name,
    firm: "VC Fund",
    role: "Managing Partner",
    status: "Active Diligence",
    lastContact: "Recently",
    location: "India",
    typicalCheck: "₹50L - ₹2Cr",
    preferences: ["Tech", "SaaS", "Outbound"],
    notes: "Evaluating round.",
    interestScore: 80,
    meetings: [],
    recommendations: [],
    notesList: [],
    reminders: [],
    emails: [],
    timeline: [],
    tasks: []
  };
};

export default function InvestorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "tasks" | "emails" | "recs">("timeline");

  // Note Form
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Reminder Form
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [submittingReminder, setSubmittingReminder] = useState(false);

  // Fetch details
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<InvestorDetail>(`/api/investors/${id}`);
      setData(response.data);
    } catch (err: any) {
      console.warn("Backend unavailable. Falling back to mock investor details.", err);

      // Check localStorage for user-added relationships first
      const storedLocalDetail = typeof window !== "undefined" ? localStorage.getItem(`local_detail_${id}`) : null;
      if (storedLocalDetail) {
        try {
          setData(JSON.parse(storedLocalDetail));
          return;
        } catch (e) {
          console.warn("Failed parsing local details.", e);
        }
      }

      // Try to find the investor name in case we have it locally
      const localProfile = MOCK_DETAILS[id as string];
      let fallbackData = localProfile;
      if (!fallbackData) {
        // Find in MOCK_INVESTORS to get correct name
        const mi = [
          { id: "p1", name: "Kunal Bahl" },
          { id: "p2", name: "Vani Kola" },
          { id: "p3", name: "Ritesh Agarwal" },
          { id: "p4", name: "Shailendra Singh" },
          { id: "p5", name: "Alfred Lin" },
          { id: "p6", name: "Kirsten Green" },
        ].find(x => x.id === id);
        fallbackData = getFallbackDetails(id as string, mi ? mi.name : "Investor Partner");
      }
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await apiClient.post(`/api/investors/${id}/notes`, { content: newNote });
      toast.showSuccess("Note saved to relationship memory.");
      setNewNote("");
      fetchDetails();
    } catch (err: any) {
      toast.showError(err.message || "Failed to add note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Add Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate.trim()) return;
    setSubmittingReminder(true);
    try {
      await apiClient.post(`/api/investors/${id}/reminders`, {
        title: newReminderTitle,
        due_date: newReminderDate
      });
      toast.showSuccess("Reminder scheduled successfully.");
      setNewReminderTitle("");
      setNewReminderDate("");
      fetchDetails();
    } catch (err: any) {
      toast.showError(err.message || "Failed to add reminder.");
    } finally {
      setSubmittingReminder(false);
    }
  };

  // Toggle checklist tasks optimistically
  const handleToggleTask = async (taskName: string, currentStatus: string) => {
    if (!data) return;
    const newStatus = currentStatus === "pending" ? "completed" : "pending";

    // Optimistic Update
    const updatedTasks = data.tasks.map(t => t.task === taskName ? { ...t, status: newStatus as any } : t);
    setData({
      ...data,
      tasks: updatedTasks
    });

    try {
      await apiClient.post(`/api/investors/${id}/tasks`, {
        task: taskName,
        status: newStatus
      });
      toast.showSuccess(`Task marked ${newStatus}`);
      fetchDetails(); // sync ActivityLog
    } catch (err: any) {
      toast.showError(err.message || "Failed to toggle task.");
      // Rollback
      fetchDetails();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-bold text-muted-foreground">Loading investor memory profile...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <span className="text-sm font-bold text-muted-foreground">Investor profile not found.</span>
        <Link href="/relationships">
          <Button variant="outline" size="sm">Back to CRM</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active Diligence":
        return "border-indigo-500/25 bg-indigo-500/10 text-indigo-500";
      case "Soft Committed":
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-500";
      case "Passed":
        return "border-rose-500/25 bg-rose-500/10 text-rose-500";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "email":
        return <Mail className="w-4 h-4 text-emerald-500" />;
      case "diligence":
        return <ShieldCheck className="w-4 h-4 text-violet-500" />;
      default:
        return <FileText className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
          <Link href="/relationships" className="hover:underline">Relationship Memory</Link>
          <span>/</span>
          <span className="text-foreground">{data.name}</span>
        </div>
        <Link href="/relationships">
          <Button variant="outline" size="sm" className="h-8">Back to CRM List</Button>
        </Link>
      </div>

      {/* Profile Overview Banner */}
      <div className="flex flex-col gap-1.5 border-b border-border/40 pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <span>{data.name}</span>
          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-bold uppercase ${getStatusBadge(data.status)}`}>
            {data.status}
          </Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          {data.role} at <b className="text-foreground">{data.firm}</b> • Last contacted {data.lastContact}
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column - Metadata Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Info Card */}
          <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {data.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">{data.name}</h3>
                  <span className="text-xs text-muted-foreground">{data.firm}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 text-xs border-t border-border/40 pt-5">

              {/* Location & typical check (Rupees) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{data.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-bold text-emerald-500 shrink-0 text-xs">₹</span>
                  <span>{data.typicalCheck} Check</span>
                </div>
              </div>

              {/* Founder note summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Founder Note Summary</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-background/50 border border-border/40">
                  {data.notes}
                </p>
              </div>

              {/* Preferences */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Investor Preferences (Memory)</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {Array.isArray(data.preferences) ? (
                    data.preferences.map((pref, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground leading-normal">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{pref}</span>
                      </li>
                    ))
                  ) : typeof data.preferences === "object" && data.preferences !== null ? (
                    Object.entries(data.preferences).map(([key, val], idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground leading-normal">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span className="capitalize">
                          <strong>{key.replace(/_/g, " ")}:</strong> {String(val)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic list-none">No preferences configured.</li>
                  )}
                </ul>
              </div>

            </CardContent>
          </Card>

          {/* Add Reminder Card */}
          <Card className="border-border/50 bg-card/45">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Schedule Reminder</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddReminder} className="space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="Task to follow up (e.g. Share deck)..."
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
                  required
                />
                <input
                  type="text"
                  placeholder="Due date (e.g. Mon, Jun 29)..."
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
                  required
                />
                <Button type="submit" size="sm" className="w-full h-8 text-[11px]" isLoading={submittingReminder}>
                  Save Reminder
                </Button>
              </form>

              {/* Active Reminders List */}
              {data.reminders && data.reminders.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                  <span className="font-bold text-[10px] uppercase text-muted-foreground">Reminders</span>
                  <div className="space-y-1.5">
                    {data.reminders.map(rem => (
                      <div key={rem.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30 text-[11px]">
                        <span className="font-medium text-foreground">{rem.title}</span>
                        <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0.2">{rem.dueDate}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Workspaces & Timelines */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tab Selection Row */}
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            {[
              { id: "timeline", label: "Activity Log", icon: History },
              { id: "notes", label: "Founder Notes", icon: FileText },
              { id: "tasks", label: "Checklist", icon: CheckSquare },
              { id: "emails", label: "Emails & Drafts", icon: Mail },
              { id: "recs", label: "AI Recs", icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${activeTab === tab.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Rendering */}
          <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs min-h-[300px]">
            <CardContent className="p-6">

              {/* TIMELINE TAB (ACTIVITY LOG) */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <div className="border-l border-border pl-6 ml-3 space-y-6 relative">
                    {data.timeline.map((event) => {
                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline icon */}
                          <span className="absolute -left-10 top-0.5 p-1.5 rounded-lg border border-border bg-card shadow-xs group-hover:scale-105 transition-transform">
                            {getTimelineIcon(event.type)}
                          </span>

                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-foreground group-hover:text-primary transition-colors">
                                {event.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground/80">{event.date}</span>
                              {event.tags && event.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 font-bold uppercase leading-none">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line bg-background/30 p-2.5 rounded-lg border border-border/30 mt-1">
                              {event.description}
                            </p>
                            <span className="text-[10px] text-muted-foreground/80 mt-1">Logged by: <b>{event.author}</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === "notes" && (
                <div className="space-y-6">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      placeholder="Add an ad-hoc memo to this relationship timeline (e.g. details from a casual sync)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden resize-none font-sans"
                      required
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" className="h-8 text-xs px-4" isLoading={submittingNote}>
                        <PlusCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Log Note</span>
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <h4 className="text-xs font-bold text-foreground">Logged Notes</h4>
                    {data.notesList && data.notesList.length > 0 ? (
                      <div className="space-y-3">
                        {data.notesList.map((note) => (
                          <div key={note.id} className="p-3.5 rounded-xl border border-border/30 bg-background/50 text-xs text-muted-foreground leading-relaxed">
                            <p className="whitespace-pre-line text-foreground/90">{note.content}</p>
                            <span className="block text-[10px] text-muted-foreground/75 mt-2">
                              Logged on {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No notes logged yet for this investor.</span>
                    )}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold text-foreground">Action Checklist</h4>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                      {data.tasks.filter(t => t.status === "completed").length}/{data.tasks.length} Completed
                    </span>
                  </div>

                  {data.tasks && data.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {data.tasks.map((t, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleTask(t.task, t.status)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background cursor-pointer transition-all duration-200"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${t.status === "completed"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-border hover:border-primary"
                            }`}>
                            {t.status === "completed" && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs font-semibold ${t.status === "completed"
                              ? "text-muted-foreground line-through decoration-muted-foreground/50"
                              : "text-foreground"
                            }`}>
                            {t.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto opacity-40 mb-2" />
                      <span className="text-xs text-muted-foreground">All sync tasks are cleared! No outstanding checklist items.</span>
                    </div>
                  )}
                </div>
              )}

              {/* EMAILS TAB */}
              {activeTab === "emails" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">Email Communications</h4>
                    <Link href={`/followups?recipient=${data.name}`}>
                      <Button size="sm" className="h-7 text-[10px] gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                        <PlusCircle className="w-3 h-3" />
                        <span>Compose New</span>
                      </Button>
                    </Link>
                  </div>

                  {data.emails && data.emails.length > 0 ? (
                    <div className="space-y-4">
                      {data.emails.map((em) => (
                        <div key={em.id} className="p-4 rounded-xl border border-border/40 bg-background/30 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase">{em.type}</span>
                              <h5 className="font-extrabold text-xs text-foreground">{em.subject}</h5>
                            </div>
                            <Badge variant={em.status === "sent" ? "success" : "warning"} className="text-[9px] px-1.5 font-bold uppercase">
                              {em.status}
                            </Badge>
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground bg-background/50 border border-border/30 p-3 rounded-lg font-mono whitespace-pre-line max-h-40 overflow-y-auto">
                            {em.body}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-medium">
                            <span>Tone: <b>{em.tone}</b></span>
                            {em.status === "draft" && (
                              <Link href={`/followups?recipient=${data.name}&draft=${em.id}`}>
                                <Button size="sm" className="h-6 text-[9px] font-bold">
                                  Open in Composer
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground block text-center py-6">No email records drafted or sent yet.</span>
                  )}
                </div>
              )}

              {/* AI RECS TAB */}
              {activeTab === "recs" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">AI Chief of Staff Strategic Recommendations</h4>
                    <Badge variant="outline" className="text-[10px] text-indigo-500 bg-indigo-500/5 border-indigo-500/20 font-bold px-2 py-0.5">
                      Gemini 2.5 Flash
                    </Badge>
                  </div>

                  {data.recommendations && data.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {data.recommendations.map((rec) => (
                        <div key={rec.id} className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                              <span className="font-extrabold text-indigo-500 flex items-center gap-1">
                                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Strategic Matchmaking Insight</span>
                              </span>
                              <Badge variant={rec.priority === "High" ? "error" : "warning"} className="text-[9px] px-1.5 font-bold uppercase">
                                {rec.priority} Priority
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 border border-border/30 p-3 rounded-lg">
                              {rec.reason}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Recommended Actions</span>
                            <div className="space-y-1.5">
                              {rec.next_best_actions.map((act, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground bg-background/50 p-2.5 rounded-lg border border-border/30">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                  <span className="font-semibold leading-normal">{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                            <span>Deadline: <b className="text-foreground">{rec.deadline}</b></span>
                            <Link href={`/followups?recipient=${data.name}`}>
                              <Button size="sm" className="h-7 text-[10px] gap-1 px-3">
                                <span>Execute follow-up</span>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground block text-center py-6">No recommendations calculated. Upload a meeting transcript to extract actions.</span>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
