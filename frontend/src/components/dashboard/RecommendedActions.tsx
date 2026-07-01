"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useExplanation } from "@/hooks/useMeetingIntelligence";
import { Sparkles, HelpCircle, ArrowRight, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { DashboardRecommendation } from "@/types/dashboard";
import {
  inferRecommendationType,
  mapPriorityToBadge,
  priorityToScore,
} from "@/lib/dashboardUtils";

interface RecommendedActionsProps {
  recommendations: DashboardRecommendation[];
  priorityScore: number;
}

export default function RecommendedActions({
  recommendations,
  priorityScore,
}: RecommendedActionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { execute: getExplanation, loading: explainLoading } = useExplanation();
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const toggleExplanation = async (
    id: string,
    actionText: string,
    reasonShort: string
  ) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (explanations[id]) return;

    try {
      const result = await getExplanation({
        recommendation: actionText,
        investor_memory: reasonShort,
        meeting_history: `Prior sync logs for recommendation ${id}`,
      });
      setExplanations((prev) => ({
        ...prev,
        [id]: result.explanation,
      }));
    } catch (err) {
      console.warn("Backend explanation API failed.", err);
      setExplanations((prev) => ({
        ...prev,
        [id]: reasonShort || "Explanation unavailable. Please try again later.",
      }));
    }
  };

  return (
    <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Recommended Next Actions</span>
          </CardTitle>
          <Link
            href="/matchmaking"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 group"
          >
            <span>Find Matches</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <CardDescription>
          Chief of Staff recommendations tailored to active pipeline status.
          {priorityScore > 0 && (
            <span className="ml-1 text-indigo-500 font-semibold">
              Priority score: {priorityScore}%
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No pending recommendations right now.</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const type = inferRecommendationType(rec.action);
            const score = priorityToScore(rec.priority);
            const explanationText =
              explanations[rec.id] || "Click the help icon to generate an explanation.";

            return (
              <div
                key={rec.id}
                className="flex flex-col p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-background/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          type === "relationship"
                            ? "default"
                            : type === "pipeline"
                            ? "info"
                            : "warning"
                        }
                        className="text-[9px] px-1.5 py-0.2 uppercase leading-none font-bold"
                      >
                        {type}
                      </Badge>
                      <Badge
                        variant={mapPriorityToBadge(rec.priority)}
                        className="text-[9px] px-1.5 py-0.2 uppercase leading-none font-bold"
                      >
                        {rec.priority}
                      </Badge>
                      <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        {score}% Match
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{rec.action}</h4>
                    <p className="text-xs text-muted-foreground">
                      {rec.investor_name} • {rec.investor_firm}
                    </p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleExplanation(rec.id, rec.action, rec.reason)}
                      className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title="Explain Reasoning"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <HelpCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 text-xs text-muted-foreground/95 leading-relaxed space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-bold text-indigo-500 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Explanation Agent Reasoning</span>
                      </div>
                      {explainLoading && (
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                      )}
                    </div>
                    <p>{explanationText}</p>
                    <div className="flex gap-2 justify-end pt-1">
                      <Link
                        href={
                          type === "relationship"
                            ? "/followups"
                            : type === "pipeline"
                            ? "/matchmaking"
                            : "/meetings"
                        }
                      >
                        <Button size="sm" className="h-7 text-[10px] px-2.5">
                          Execute Action
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
