"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays, Clock, FileText, ArrowRight } from "lucide-react";
import type { DashboardMeeting } from "@/types/dashboard";
import { formatMeetingDate } from "@/lib/dashboardUtils";

interface UpcomingMeetingsProps {
  meetings: DashboardMeeting[];
}

export default function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  return (
    <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Upcoming Meetings</CardTitle>
          <Link href="/meetings" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 group">
            <span>View Intel</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <CardDescription>
          Your schedule for pitch meetings and diligence syncs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming meetings scheduled.</p>
          </div>
        ) : (
          meetings.map((m) => {
            const { label: timeLabel, isToday } = formatMeetingDate(m.date);
            const badgeLabel = m.interest_level || m.sentiment || "Meeting";

            return (
              <div
                key={m.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  isToday
                    ? "bg-indigo-500/5 border-indigo-500/30 dark:bg-indigo-500/10 hover:border-indigo-500/50"
                    : "bg-background/50 border-border/40 hover:border-border hover:bg-background/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg mt-0.5 shrink-0 ${
                      isToday ? "bg-indigo-500/15 text-indigo-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CalendarDays className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">{m.investor_name}</span>
                      <span className="text-xs text-muted-foreground">• {m.investor_firm}</span>
                      <Badge
                        variant={isToday ? "default" : "secondary"}
                        className="text-[9px] px-1.5 py-0.2 uppercase leading-none font-bold"
                      >
                        {badgeLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                        {timeLabel}
                      </span>
                      {m.summary && (
                        <span className="line-clamp-1">{m.summary}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Link href={`/relationships/${m.investor_id}`} className="w-full sm:w-auto">
                    <Button size="sm" variant={isToday ? "default" : "outline"} className="text-xs gap-1.5 w-full">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Memory Profile</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
