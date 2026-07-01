"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Mail, ArrowRight, Clock, Sparkles } from "lucide-react";
import type { DashboardFollowUp } from "@/types/dashboard";
import { formatFollowUpDue } from "@/lib/dashboardUtils";

interface PendingFollowupsProps {
  followups: DashboardFollowUp[];
}

export default function PendingFollowups({ followups }: PendingFollowupsProps) {
  return (
    <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Pending Follow-ups</CardTitle>
          <Link
            href="/followups"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <CardDescription>
          AI-detected tasks from recent meeting transcripts and emails.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {followups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mail className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No pending follow-ups.</p>
          </div>
        ) : (
          followups.map((fu) => {
            const priority = fu.days_since >= 3 ? "high" : fu.days_since >= 1 ? "medium" : "low";
            const context = fu.context || fu.email;

            return (
              <div
                key={fu.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 hover:border-border transition-all duration-200 bg-background/50 hover:bg-background/80"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/relationships/${fu.investor_id}`}
                        className="hover:underline font-bold text-sm text-foreground"
                      >
                        {fu.investor_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">• {fu.investor_firm}</span>
                      <Badge
                        variant={priority === "high" ? "error" : "warning"}
                        className="text-[9px] px-1.5 py-0.2 leading-none uppercase font-bold"
                      >
                        {priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug max-w-md line-clamp-2">
                      {context}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/80">
                      <Clock className="w-3 h-3" />
                      <span>{formatFollowUpDue(fu.days_since)}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/followups?recipient=${encodeURIComponent(fu.investor_name)}&draft=${fu.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 hover:border-primary/50 hover:bg-primary/5 w-full sm:w-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Draft Email</span>
                  </Button>
                </Link>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
