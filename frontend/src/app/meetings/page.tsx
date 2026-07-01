"use client";

import React, { useState } from "react";
import TranscriptUpload from "@/components/intelligence/TranscriptUpload";
import MeetingAnalysis, { AnalysisData } from "@/components/intelligence/MeetingAnalysis";
import { BrainCircuit, Info, Sparkles, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePersistMeeting } from "@/hooks/useMeetingIntelligence";
import { useRouter } from "next/navigation";

const ALFRED_LIN_MEETING: AnalysisData = {
  investor: "Alfred Lin",
  firm: "Sequoia Capital",
  date: "June 27, 2026 (2 hours ago)",
  duration: "30 mins",
  summary: "Jane pitched FounderOS AI. Alfred Lin was highly engaged in the product demo, specifically looking at how the Explanation Agent details check size and sector matching logic. He asked detailed questions regarding pre-seed hard circles, contract storage, and security. He requested a formal follow-up containing the pre-seed safe agreement drafts and pilot developer quotes.",
  interestLevel: "High",
  interestScore: 92,
  concerns: [
    "Security controls of ChromaDB vector databases parsing confidential pitch information.",
    "User churn if developers do not find the agent integration helpful in day-to-day operations.",
  ],
  questions: [
    "How does the Vector matching algorithm rank relevance? Are you using custom semantic weights?",
    "What checks do you have in place to prevent the LLM from hallucinating relationship memories?",
    "Are you raising on a standard YC safe agreement, or are there custom side-letters?",
  ],
  actionItems: [
    { task: "Send Alfred pre-seed SAFE agreement drafts & deal terms", status: "pending" },
    { task: "Prepare pilot developer quotes and testimonials from 2 active founders", status: "pending" },
    { task: "Share the database security whitepaper and vector storage setup", status: "pending" },
  ],
};

const KIRSTEN_GREEN_MEETING: AnalysisData = {
  investor: "Kirsten Green",
  firm: "Forerunner Ventures",
  date: "June 25, 2026 (2 days ago)",
  duration: "45 mins",
  summary: "Initial introduction call. Kirsten Green was curious about how consumer platforms and commerce networks integrate with B2B fundraising platforms. She asked questions regarding our database pipeline sizes, and requested early pilot stats. High alignment with Forerunner's fintech portfolio bets.",
  interestLevel: "Medium",
  interestScore: 78,
  concerns: [
    "Consumer network effects are hard to establish in pure B2B fundraising platforms.",
    "First-check size requirements matching. Forerunner usually leads series A rather than early pre-seeds.",
  ],
  questions: [
    "How do you plan to scale the investor database to keep checks, locations, and stages updated in real time?",
    "What is the current traction of active pilot users on the platform?",
  ],
  actionItems: [
    { task: "Send Kirsten product demo video link & revised dev roadmap", status: "completed" },
    { task: "Schedule follow-up partner sync for early July", status: "pending" },
  ],
};

export default function MeetingsPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [savedMeetingInfo, setSavedMeetingInfo] = useState<any>(null);
  const { execute: persistMeeting } = usePersistMeeting();
  const router = useRouter();

  const handleAnalysisComplete = async (data: AnalysisData) => {
    setAnalysisData(data);
    setIsAutoSaving(true);
    
    console.log("Analysis completed");
    console.log("Calling /api/meetings/persist");
    
    try {
      const payload = {
        investor_name: data.investor || data.investor_name || "Unknown Investor",
        firm: data.firm || "Venture Fund",
        transcript: data.transcript || `Raw discussion transcript with ${data.investor} regarding product and go-to-market.`,
        summary: data.summary || "",
        date: new Date().toISOString().split("T")[0],
        duration: data.duration || "30 mins",
        sentiment: data.sentiment || "Neutral",
        interest_level: data.interestLevel || data.interest_level || "Medium",
        interest_score: data.interestScore || 70,
        concerns: data.concerns || [],
        questions: data.questions || [],
        next_steps: data.next_steps || data.actionItems?.map(ai => ai.task) || [],
        action_items: data.actionItems || [],
        follow_up_date: data.follow_up_date || ""
      };
      
      const result = await persistMeeting(payload);
      console.log("Persist response:", result);
      setSavedMeetingInfo(result);
      
      // Invalidate caches and refresh data across dashboard, follow-ups, timeline
      router.refresh();
    } catch (err) {
      console.error("Failed auto-persisting meeting:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4" />
          <span>Call Analyzer & Intelligence</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Meeting Intelligence
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Upload audio, video, or text logs of your investor meetings. Our Chief of Staff parses topics, grades interest scores, and outlines actionable deliverables.
        </p>
      </div>

      {/* Upload area or template selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <TranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>
        
        {/* Quick Demo Templates */}
        <div className="p-5 rounded-2xl border border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Interactive Templates</span>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Don't have a transcript file ready? Click below to instantly load mock pitch call outcomes parsed by the agent.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="outline"
              onClick={() => handleAnalysisComplete(ALFRED_LIN_MEETING)}
              className="text-xs justify-start h-10 w-full hover:border-primary/50 hover:bg-primary/5 font-semibold text-foreground/90 border-border/60"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              Load Sequoia (Alfred Lin) Call
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAnalysisComplete(KIRSTEN_GREEN_MEETING)}
              className="text-xs justify-start h-10 w-full hover:border-primary/50 hover:bg-primary/5 font-semibold text-foreground/90 border-border/60"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Load Forerunner (Kirsten Green) Call
            </Button>
          </div>
          
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/80 leading-none">
            <Info className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Select one to explore analyzed outcomes.</span>
          </div>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisData ? (
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Analyzed Transcript Outcomes
            </h3>
            <button
              onClick={() => {
                setAnalysisData(null);
                setSavedMeetingInfo(null);
              }}
              className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              Clear Analysis
            </button>
          </div>
          <MeetingAnalysis 
            data={analysisData} 
            isAutoSaving={isAutoSaving}
            isSaved={!!savedMeetingInfo}
            savedMeetingInfo={savedMeetingInfo}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-card/10 backdrop-blur-xs min-h-[250px] mt-2">
          <FolderUp className="w-10 h-10 text-muted-foreground/60 mb-3" />
          <h4 className="font-bold text-sm text-foreground">No active analysis loaded</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Drag a file into the upload zone or choose one of our templates to inspect AI insights.
          </p>
        </div>
      )}
    </div>
  );
}
