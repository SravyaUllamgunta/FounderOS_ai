export interface DashboardSummary {
  active_investors: number;
  soft_committed: number;
  upcoming_meetings: number;
  pending_followups: number;
}

export interface DashboardChecklistItem {
  name: string;
  status: string;
  details: string;
}

export interface DashboardRecommendation {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_firm: string;
  action: string;
  reason: string;
  status: string;
  priority: string;
}

export interface DashboardMeeting {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_firm: string;
  date: string;
  summary: string;
  sentiment?: string;
  interest_level?: string;
}

export interface DashboardFollowUp {
  id: number;
  meeting_id: string;
  investor_id: string;
  investor_name: string;
  investor_firm: string;
  email: string;
  status: string;
  context: string;
  days_since: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  investor_name: string;
}

export interface DashboardScores {
  fundraising_readiness_score: number;
  priority_score: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  scores: DashboardScores;
  checklist: DashboardChecklistItem[];
  pending_actions: DashboardRecommendation[];
  upcoming_meetings: DashboardMeeting[];
  pending_followups: DashboardFollowUp[];
  recent_activity: DashboardActivity[];
  completion_percentage: number;
  missing_fields: string[];
}
