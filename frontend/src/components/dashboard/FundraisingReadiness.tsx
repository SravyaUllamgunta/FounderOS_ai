"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle, AlertCircle, ArrowUpRight } from "lucide-react";
import type { DashboardChecklistItem } from "@/types/dashboard";
import { readinessLabel, readinessLevelText } from "@/lib/dashboardUtils";

interface FundraisingReadinessProps {
  score: number;
  checklist: DashboardChecklistItem[];
}

export default function FundraisingReadiness({ score, checklist }: FundraisingReadinessProps) {
  const badgeVariant = score >= 80 ? "success" : "warning";

  return (
    <Card className="h-full border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Fundraising Readiness</CardTitle>
          <Badge variant={badgeVariant} className="font-semibold px-2 py-0.5">
            {readinessLabel(score)}
          </Badge>
        </div>
        <CardDescription>
          Your score based on deck audit, data room completion, and meetings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 flex-1">
        <div className="flex items-center gap-6 p-4 rounded-xl bg-accent/10 border border-border/30">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-indigo-500/20 bg-background text-foreground font-black text-2xl tracking-tighter">
            {score}
            <span className="text-xs text-muted-foreground font-normal">/100</span>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <span>Readiness Level: {readinessLevelText(score)}</span>
            </div>
            <Progress value={score} indicatorClassName="bg-linear-to-r from-blue-500 to-indigo-600" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Complete remaining checklist items to improve your readiness score.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist</h4>
          {checklist.length === 0 ? (
            <p className="text-xs text-muted-foreground">No checklist items available yet.</p>
          ) : (
            <div className="space-y-2.5">
              {checklist.map((cp, idx) => (
                <div key={idx} className="flex items-start justify-between text-sm group">
                  <div className="flex items-start gap-2.5">
                    {cp.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : cp.status === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span
                        className={
                          cp.status === "completed"
                            ? "text-foreground/90 font-medium"
                            : "text-muted-foreground/95"
                        }
                      >
                        {cp.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/75 leading-none mt-0.5">
                        {cp.details}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer self-center" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
