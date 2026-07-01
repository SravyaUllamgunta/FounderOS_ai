"use client";

import React, { useCallback, useEffect, useState } from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import FundraisingReadiness from "@/components/dashboard/FundraisingReadiness";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import PendingFollowups from "@/components/dashboard/PendingFollowups";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/Button";
import apiClient from "@/services/apiClient";
import type { DashboardResponse } from "@/types/dashboard";
import { AlertCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import StartupProfileModal from "@/components/dashboard/StartupProfileModal";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<DashboardResponse>("/api/dashboard");
      setData(response.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground font-semibold">
          Loading dashboard...
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground">Unable to load dashboard</h3>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
        <Button onClick={fetchDashboard} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8 w-full pb-12 font-sans">
      
      {/* Startup Profile Completion Banner */}
      {data.completion_percentage !== undefined && data.completion_percentage < 100 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 text-xs font-semibold gap-4 leading-normal shadow-sm animate-in fade-in duration-300">
          <div className="space-y-1.5 flex-1">
            <span className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Complete your Startup Profile ({data.completion_percentage}%)</span>
            </span>
            <span className="text-muted-foreground text-xs font-medium block">
              Provide your details to enable accurate AI matchmaking scores. Missing fields: <b>{data.missing_fields.join(", ")}</b>.
            </span>
            <div className="w-full max-w-md h-2 rounded-full bg-border/60 mt-2 overflow-hidden border border-border/20">
              <div 
                className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${data.completion_percentage}%` }} 
              />
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="self-start md:self-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-500/10 active:scale-98"
          >
            Enter Startup Information
          </button>
        </div>
      )}

      <WelcomeHeader summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col">
          <FundraisingReadiness
            score={data.scores.fundraising_readiness_score}
            checklist={data.checklist}
          />
        </div>
        <div className="flex flex-col">
          <UpcomingMeetings meetings={data.upcoming_meetings} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col">
          <RecommendedActions
            recommendations={data.pending_actions}
            priorityScore={data.scores.priority_score}
          />
        </div>
        <div className="flex flex-col">
          <PendingFollowups followups={data.pending_followups} />
        </div>
      </div>

      <div className="w-full">
        <QuickActions />
      </div>

      <div className="w-full">
        <RecentActivity activities={data.recent_activity} />
      </div>

      {/* Modal Dialog */}
      <StartupProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={fetchDashboard}
      />
    </div>
  );
}
