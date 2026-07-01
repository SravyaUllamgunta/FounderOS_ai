"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Calendar, TrendingUp, Landmark, ShieldCheck } from "lucide-react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { DashboardSummary } from "@/types/dashboard";

interface WelcomeHeaderProps {
  summary?: DashboardSummary;
}

export default function WelcomeHeader({ summary: summaryProp }: WelcomeHeaderProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(summaryProp ?? null);
  const { user } = useAuth();

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    setCurrentTime(new Date().toLocaleDateString(undefined, options));
  }, []);

  useEffect(() => {
    if (summaryProp) {
      setSummary(summaryProp);
      return;
    }

    const fetchSummary = async () => {
      try {
        const response = await apiClient.get<DashboardSummary & { founder_name?: string }>(
          "/api/dashboard/summary"
        );
        setSummary(response.data);
      } catch (err) {
        console.warn("Failed to load dashboard metrics summary.", err);
      }
    };
    fetchSummary();
  }, [summaryProp]);

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Chief of Staff Active</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name.split(" ")[0]}
            </h2>
            <p className="text-sm md:text-base text-blue-100/90 mt-1 max-w-xl font-medium">
              You have {summary?.pending_followups ?? 0} pending follow-up drafts.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium self-start md:self-auto">
            <Calendar className="w-4 h-4" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Pipeline Discussions",
            value: String(summary?.active_investors ?? 0),
            sub: "Active investors in CRM",
            icon: TrendingUp,
            color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
          },
          {
            title: "Upcoming Meetings",
            value: String(summary?.upcoming_meetings ?? 0),
            sub: "Pitch syncs this week",
            icon: Landmark,
            color: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20",
          },
          {
            title: "Soft Committed",
            value: String(summary?.soft_committed ?? 0),
            sub: "Investors marked soft committed",
            icon: ShieldCheck,
            color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
          },
          {
            title: "Action checklist items",
            value: String(summary?.pending_followups ?? 0),
            sub: "AI-extracted action list",
            icon: Sparkles,
            color: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/20",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl border border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex items-center justify-between shadow-xs"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground/80">
                  {stat.title}
                </span>
                <span className="text-xl md:text-2xl font-black mt-1 text-foreground tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {stat.sub}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} self-start`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
