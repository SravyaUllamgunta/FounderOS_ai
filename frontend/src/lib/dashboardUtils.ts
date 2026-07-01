import type { BadgeProps } from "@/components/ui/Badge";

export function formatMeetingDate(dateStr: string): { label: string; isToday: boolean } {
  if (!dateStr) {
    return { label: "Date TBD", isToday: false };
  }

  const parsed = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return { label: dateStr, isToday: false };
  }

  const today = new Date();
  const isToday =
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate();

  if (isToday) {
    const timePart = dateStr.includes("T")
      ? parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";
    return {
      label: timePart ? `Today, ${timePart}` : "Today",
      isToday: true,
    };
  }

  return {
    label: parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...(dateStr.includes("T") ? { hour: "numeric", minute: "2-digit" } : {}),
    }),
    isToday: false,
  };
}

export function mapPriorityToBadge(priority: string): BadgeProps["variant"] {
  const normalized = priority.toLowerCase();
  if (normalized === "high" || normalized === "urgent") return "error";
  if (normalized === "medium") return "warning";
  if (normalized === "low") return "secondary";
  return "info";
}

export function inferRecommendationType(
  action: string
): "relationship" | "pipeline" | "diligence" {
  const lower = action.toLowerCase();
  if (
    lower.includes("investor") ||
    lower.includes("pipeline") ||
    lower.includes("target") ||
    lower.includes("match")
  ) {
    return "pipeline";
  }
  if (
    lower.includes("upload") ||
    lower.includes("data room") ||
    lower.includes("document") ||
    lower.includes("contract")
  ) {
    return "diligence";
  }
  return "relationship";
}

export function priorityToScore(priority: string): number {
  const normalized = priority.toLowerCase();
  if (normalized === "high" || normalized === "urgent") return 95;
  if (normalized === "medium") return 80;
  if (normalized === "low") return 65;
  return 75;
}

export function formatFollowUpDue(daysSince: number): string {
  if (daysSince === 0) return "Due today";
  if (daysSince === 1) return "Due tomorrow";
  if (daysSince <= 7) return `Due in ${daysSince} days`;
  return `${daysSince} days since meeting`;
}

export function readinessLabel(score: number): string {
  if (score >= 80) return "Fundraising Ready";
  if (score >= 60) return "Nearing Readiness";
  if (score >= 40) return "In Progress";
  return "Getting Started";
}

export function readinessLevelText(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}
