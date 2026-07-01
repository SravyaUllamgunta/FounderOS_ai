"use client";

import React from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIndustry: string;
  setSelectedIndustry: (ind: string) => void;
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onClearFilters: () => void;
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedIndustry,
  setSelectedIndustry,
  selectedStage,
  setSelectedStage,
  selectedLocation,
  setSelectedLocation,
  sortBy,
  setSortBy,
  onClearFilters,
}: FiltersProps) {
  const industries = ["All Sectors", "AI", "SaaS", "FinTech", "HealthTech", "Web3"];
  const stages = ["All Stages", "Pre-Seed", "Seed", "Series A", "Series B"];
  const locations = ["All Locations", "San Francisco", "New York", "Boston", "London", "Remote"];
  const sortOptions = [
    { value: "match", label: "Match Score (High-Low)" },
    { value: "name", label: "Firm Name (A-Z)" },
    { value: "check_high", label: "Check Size (High-Low)" },
    { value: "check_low", label: "Check Size (Low-High)" },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedIndustry !== "All Sectors" ||
    selectedStage !== "All Stages" ||
    selectedLocation !== "All Locations";

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-md">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search investors by name, firm, role or recent bets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all text-foreground"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:inline whitespace-nowrap font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-56 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/45 text-foreground cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* Filter Dropdowns Grid */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span>Filters:</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-500/25 hover:border-rose-500/50 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
