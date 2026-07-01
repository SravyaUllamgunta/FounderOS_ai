"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckSquare, Film, Sparkles, Mail, UserPlus, Database } from "lucide-react";
import type { DashboardActivity } from "@/types/dashboard";
import type { LucideIcon } from "lucide-react";

interface RecentActivityProps {
  activities: DashboardActivity[];
}

function getActivityStyle(type: string): { icon: LucideIcon; color: string } {
  const normalized = type.toLowerCase();
  if (normalized.includes("meeting") || normalized.includes("transcript")) {
    return {
      icon: Film,
      color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
    };
  }
  if (normalized.includes("email") || normalized.includes("follow")) {
    return {
      icon: Mail,
      color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
    };
  }
  if (normalized.includes("investor") || normalized.includes("match")) {
    return {
      icon: UserPlus,
      color: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20",
    };
  }
  if (normalized.includes("data") || normalized.includes("document")) {
    return {
      icon: Database,
      color: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/20",
    };
  }
  return {
    icon: CheckSquare,
    color: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/20",
  };
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
        <CardDescription>
          Logs of meetings analyzed, documents parsed, and emails sent.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          </div>
        ) : (
          <div className="relative border-l border-border pl-6 ml-3 space-y-6">
            {activities.map((act) => {
              const { icon: Icon, color } = getActivityStyle(act.type);
              const description = act.investor_name
                ? `${act.description} (${act.investor_name})`
                : act.description;

              return (
                <div key={act.id} className="relative group">
                  <span
                    className={`absolute -left-10 top-0.5 p-1.5 rounded-lg border border-border bg-card ${color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      {act.title}
                    </span>
                    <p className="text-xs text-muted-foreground leading-normal">{description}</p>
                    <span className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                      {act.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
