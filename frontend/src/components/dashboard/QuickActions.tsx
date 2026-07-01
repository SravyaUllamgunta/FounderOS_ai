"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileAudio, Users, Sparkles, FolderPlus, Send } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Analyze Call Transcript",
      desc: "Extract insights & actions",
      href: "/meetings",
      icon: FileAudio,
      color: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
    },
    {
      title: "Find Matchmaking Leads",
      desc: "Match startup profile to VCs",
      href: "/matchmaking",
      icon: Users,
      color: "from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500",
    },
    {
      title: "Draft Follow-up Email",
      desc: "Generate tone-tailored mail",
      href: "/followups",
      icon: Sparkles,
      color: "from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
    },
    {
      title: "Add Interaction Log",
      desc: "Log an email or quick call",
      href: "/relationships",
      icon: FolderPlus,
      color: "from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 dark:from-slate-800 dark:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800",
    },
  ];

  return (
    <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
        <CardDescription>
          Trigger core features and fundraising agent tasks immediately.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Link key={i} href={act.href} className="flex h-full">
              <Button
                variant="gradient"
                className={`w-full flex-col items-start gap-2.5 p-5 h-full rounded-xl bg-linear-to-tr text-left transition-all duration-300 hover:scale-101 border border-border/30 hover:border-transparent ${act.color}`}
              >
                <div className="p-2 rounded-lg bg-white/10 text-white shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-0.5 text-white">
                  <span className="font-bold text-sm leading-snug">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-white/80 font-normal leading-normal">
                    {act.desc}
                  </span>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
