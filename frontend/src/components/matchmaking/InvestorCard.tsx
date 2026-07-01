"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  TrendingUp,
  DollarSign,
  Sparkles,
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface Investor {
  id: string;
  name: string;
  firm: string;
  role: string;
  matchScore: number;
  industries: string[];
  stages: string[];
  checkSize: string;
  location: string;
  whyMatches: string;
  recentInvestments: string[];
}

interface InvestorCardProps {
  investor: Investor;
}

export default function InvestorCard({ investor }: InvestorCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 75) return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <Card className="flex flex-col justify-between border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs hover:shadow-lg hover:border-border transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-foreground leading-none">
                {investor.name}
              </span>
              <span className="text-xs text-muted-foreground">
                • {investor.role}
              </span>
            </div>
            <h4 className="font-extrabold text-base tracking-tight text-foreground/90 leading-snug">
              {investor.firm}
            </h4>
          </div>
          
          <div className={`flex items-center px-2 py-0.5 rounded border text-xs font-black tracking-tighter shrink-0 ${getScoreColor(investor.matchScore)}`}>
            {investor.matchScore}% Match
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 pb-3 text-xs">
        {/* Core parameters: location, check size */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-accent/15 border border-border/30">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{investor.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>{investor.checkSize}</span>
          </div>
        </div>

        {/* Sectors & Stages */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {investor.stages.map((stage) => (
              <Badge key={stage} variant="default" className="text-[9px] px-2 py-0.2 rounded-md font-bold uppercase">
                {stage}
              </Badge>
            ))}
            {investor.industries.map((ind) => (
              <Badge key={ind} variant="secondary" className="text-[9px] px-2 py-0.2 rounded-md font-semibold">
                {ind}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recent investments */}
        <div className="text-[10px] text-muted-foreground/80 leading-relaxed">
          <span className="font-bold text-foreground/70">Recent Investments: </span>
          {investor.recentInvestments.join(", ")}
        </div>

        {/* Explanation Toggler */}
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>{showExplanation ? "Hide Explanation" : "Explain Match"}</span>
          {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showExplanation && (
          <div className="p-3 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 leading-relaxed text-muted-foreground animate-in slide-in-from-top-2 duration-200">
            <p className="text-[10px]">{investor.whyMatches}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 border-t border-border/40 flex gap-2">
        <Link href={`/followups?recipient=${investor.name}`} className="flex-1">
          <Button size="sm" className="w-full text-[11px] gap-1.5 h-8">
            <Mail className="w-3.5 h-3.5" />
            <span>Connect</span>
          </Button>
        </Link>
        
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setShowExplanation(!showExplanation)}
          title="Match Details"
        >
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </Button>
      </CardFooter>
    </Card>
  );
}
