"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  MailCheck,
  History,
  X,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & key tasks",
  },
  {
    name: "Investor Matchmaking",
    href: "/matchmaking",
    icon: Users,
    description: "Find matching investors",
  },
  {
    name: "Meeting Intelligence",
    href: "/meetings",
    icon: BrainCircuit,
    description: "Analyze transcripts & actions",
  },
  {
    name: "Follow-up Generator",
    href: "/followups",
    icon: MailCheck,
    description: "Draft tailored follow-ups",
  },
  {
    name: "Relationship Memory",
    href: "/relationships",
    icon: History,
    description: "Track investor interactions",
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/65 dark:bg-card/45 border-r border-border/50 backdrop-blur-md">
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            F
          </div>
          <span className="font-extrabold text-lg bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground to-muted-foreground tracking-tight">
            FounderOS <span className="text-blue-500 font-medium text-xs ml-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">AI</span>
          </span>
        </Link>
        <button
          className="p-1 rounded-lg md:hidden text-muted-foreground hover:bg-accent"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium border border-transparent",
                isActive
                  ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div className="flex flex-col">
                <span>{item.name}</span>
                <span className="text-[10px] text-muted-foreground/70 font-normal leading-none mt-0.5 group-hover:text-muted-foreground transition-colors">
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer info card */}
      <div className="p-4 border-t border-border/50">
        <div className="p-4 rounded-xl bg-linear-to-tr from-blue-900/10 to-indigo-900/10 border border-blue-500/15 dark:border-blue-500/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">Pre-Seed Mode</div>
            <div className="text-[10px] text-muted-foreground">Targeting $1.5M Goal</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (Portal overlay) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
