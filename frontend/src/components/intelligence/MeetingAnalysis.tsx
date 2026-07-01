"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useRecommendations, useExplanation, usePersistMeeting } from "@/hooks/useMeetingIntelligence";
import apiClient from "@/services/apiClient";
import {
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  Mail,
  Calendar,
  Clock,
  ThumbsUp,
  Brain,
  TrendingUp,
  Compass,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export interface ActionItem {
  task: string;
  status: "pending" | "completed";
}

export interface AnalysisData {
  investor: string;
  firm: string;
  date: string;
  duration: string;
  summary: string;
  interestLevel: string;
  interestScore: number;
  concerns: string[];
  questions: string[];
  actionItems: ActionItem[];
  
  // Persistence fields
  transcript?: string;
  investor_name?: string;
  next_steps?: string[];
  commitments?: string;
  sentiment?: string;
  follow_up_date?: string;
  interest_level?: string;
  interest_score?: number;
}

interface MeetingAnalysisProps {
  data: AnalysisData;
  isAutoSaving?: boolean;
  isSaved?: boolean;
  savedMeetingInfo?: any;
}

export default function MeetingAnalysis({ 
  data,
  isAutoSaving = false,
  isSaved = false,
  savedMeetingInfo: savedMeetingInfoProp = null
}: MeetingAnalysisProps) {
  const [actions, setActions] = useState<ActionItem[]>(data.actionItems);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("new");
  const [saved, setSaved] = useState(isSaved);
  const [persisting, setPersisting] = useState(false);
  const [savedMeetingInfo, setSavedMeetingInfo] = useState<any>(savedMeetingInfoProp);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    setSavedMeetingInfo(savedMeetingInfoProp);
  }, [savedMeetingInfoProp]);
  
  const { execute: getRecs, data: recData, loading: recLoading } = useRecommendations();
  const { execute: getExplain, data: explainData, loading: explainLoading } = useExplanation();
  const { execute: persistMeeting } = usePersistMeeting();

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const response = await apiClient.get("/api/investors");
        if (response.data && Array.isArray(response.data)) {
          setInvestors(response.data);
        }
      } catch (err) {
        console.warn("Failed to fetch CRM investors for selector", err);
      }
    };
    fetchInvestors();
  }, []);

  const handleSaveToCRM = async () => {
    setPersisting(true);
    try {
      const isNew = selectedInvestorId === "new";
      const payload = {
        investor_id: isNew ? null : selectedInvestorId,
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
        follow_up_date: data.follow_up_date || "",
        recommendations: recData?.next_best_actions || [],
        recommendation_reason: recData?.reason || "",
        recommendation_priority: recData?.priority || "Medium",
        recommendation_deadline: recData?.deadline || ""
      };
      
      const result = await persistMeeting(payload);
      setSaved(true);
      setSavedMeetingInfo(result);
    } catch (err) {
      console.error("Save to CRM failed", err);
    } finally {
      setPersisting(false);
    }
  };

  useEffect(() => {
    setActions(data.actionItems);
    
    // Fetch recommendations based on the meeting data summary
    getRecs({
      investor_profile: `${data.investor} - Partner at ${data.firm}`,
      meeting_summary: data.summary,
      memory: `Interest level is graded ${data.interestLevel}. Concerns: ${data.concerns.join(", ")}`,
      past_meetings: []
    }).catch(err => console.warn("Error getting recommendations", err));

    // Fetch explanation matching analysis
    getExplain({
      recommendation: `Send formal follow-up containing the pre-seed safe agreement drafts and pilot developer quotes to ${data.investor}.`,
      investor_memory: `Interest: ${data.interestLevel} (${data.interestScore}%). Concerns: ${data.concerns.join(", ")}`,
      meeting_history: data.summary
    }).catch(err => console.warn("Error getting explanation", err));
  }, [data, getRecs, getExplain]);

  const toggleAction = (idx: number) => {
    const updated = [...actions];
    updated[idx].status = updated[idx].status === "pending" ? "completed" : "pending";
    setActions(updated);
  };

  const getInterestColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  const getPriorityColor = (prio?: string) => {
    const p = prio?.toLowerCase() || "medium";
    if (p === "high") return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (p === "medium") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Save & Sync to CRM Bar */}
      <Card className="border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 backdrop-blur-xs shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>Link & Log Meeting to CRM</span>
            </h4>
            <p className="text-[11px] text-muted-foreground font-semibold">
              {isAutoSaving 
                ? "Auto-persistence in progress. Generating follow-ups, memories, and dashboard updates."
                : saved 
                  ? `Successfully synced this call under ${savedMeetingInfo?.investor_name} (${savedMeetingInfo?.firm})`
                  : "Select an existing CRM relationship or register a new investor profile below."
              }
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isAutoSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-muted-foreground font-semibold">
                  Saving meeting details to CRM...
                </span>
              </div>
            ) : saved ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Synced to CRM
                </span>
                <Link href={`/relationships/${savedMeetingInfo?.investor_id}`}>
                  <Button size="sm" className="h-9 font-semibold text-xs gap-1.5">
                    <span>View Memory Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <select
                  value={selectedInvestorId}
                  onChange={(e) => setSelectedInvestorId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground font-semibold cursor-pointer max-w-xs"
                >
                  <option value="new">
                    Create New: {data.investor} ({data.firm})
                  </option>
                  {investors.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Link to: {inv.name} ({inv.firm})
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleSaveToCRM}
                  isLoading={persisting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 shadow-md shadow-indigo-500/10 whitespace-nowrap"
                >
                  Save & Sync to CRM
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Meta Card */}
      <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight">{data.investor}</h3>
                  <span className="text-sm text-muted-foreground">• {data.firm}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {data.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {data.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Interest level indicator */}
            <div className="flex items-center gap-4 border-l md:border-l border-border/50 pl-0 md:pl-6 self-start md:self-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Investor Interest</span>
                <span className="text-lg font-black mt-0.5">{data.interestLevel}</span>
              </div>
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border text-sm font-black ${getInterestColor(data.interestScore)}`}>
                {data.interestScore}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Summary & Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extracted Summary & Concerns (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Extracted Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {data.summary}
              </p>
            </CardContent>
          </Card>

          {/* Investor Concerns */}
          <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Investor Concerns & Friction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.concerns.map((con, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-muted-foreground leading-normal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{con}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Questions Asked (Span 1) */}
        <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Questions Asked</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.questions.map((q, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-normal">
                <Badge variant="outline" className="w-5 h-5 rounded-full p-0 flex items-center justify-center font-bold text-[9px] shrink-0 border-blue-500/20 text-blue-500 bg-blue-500/5">
                  Q{idx + 1}
                </Badge>
                <span>{q}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            <span>Action Items Checklist</span>
          </CardTitle>
          <Link href={`/followups?recipient=${data.investor}`}>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shadow-xs border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5 font-semibold">
              <Mail className="w-3 h-3" />
              <span>Draft Follow-up</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((act, idx) => (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                act.status === "completed"
                  ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-muted-foreground/70"
                  : "bg-background/40 border-border/40 hover:bg-background/80 text-foreground"
              }`}
            >
              {act.status === "completed" ? (
                <CheckSquare className="w-4.5 h-4.5 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Square className="w-4.5 h-4.5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <span className={`text-xs leading-normal font-medium ${act.status === "completed" ? "line-through" : ""}`}>
                {act.task}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dual Column AI Actions and Matchmaking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recommendation Agent outcomes */}
        <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
              <span>Next Best Actions (AI Chief of Staff)</span>
            </CardTitle>
            {recLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {recData ? (
              <div className="space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant="outline" className={`font-bold px-2.5 py-0.5 ${getPriorityColor(recData.priority)}`}>
                      {recData.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground font-semibold">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Deadline: {recData.deadline}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-foreground/90">Strategic Actions:</span>
                  <div className="space-y-2">
                    {recData.next_best_actions.map((act, index) => (
                      <div key={index} className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl leading-normal text-muted-foreground">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40 text-muted-foreground mt-2 leading-relaxed">
                  <span className="font-bold text-foreground">Why: </span>
                  {recData.reason}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[150px]">
                {recLoading ? (
                  <span className="animate-pulse">Analyzing relationship history...</span>
                ) : (
                  <span>No recommendations active.</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation Agent outcomes */}
        <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-blue-500" />
              <span>Investor Matchmaking Analysis</span>
            </CardTitle>
            {explainLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {explainData ? (
              <div className="space-y-4 text-xs leading-relaxed">
                <div className="flex items-center justify-between border-b border-border/30 pb-3">
                  <span className="font-bold text-foreground">AI Chief of Staff Insight</span>
                  <Badge variant="outline" className="text-[10px] text-blue-500 bg-blue-500/5 border-blue-500/20 font-bold px-2 py-0.5">
                    Match Analysis
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-foreground/90 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-blue-500" />
                    <span>Dynamic Matchmaking Explanation:</span>
                  </span>
                  <p className="text-muted-foreground bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-xl leading-relaxed">
                    {explainData.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-900/40 dark:bg-slate-950/40 border border-border/40 text-[10px] text-muted-foreground leading-normal">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Synthesized using recommendation patterns, investor memory checkpoints, and past meetings history logs.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[150px]">
                {explainLoading ? (
                  <span className="animate-pulse">Evaluating stage and thesis alignment...</span>
                ) : (
                  <span>No matchmaking explanation active.</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
