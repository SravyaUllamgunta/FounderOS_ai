"use client";

import React, { useState, useEffect, useMemo } from "react";
import Filters from "@/components/matchmaking/Filters";
import InvestorCard, { Investor } from "@/components/matchmaking/InvestorCard";
import { Users, Info, ArrowLeftRight, Landmark, Loader2 } from "lucide-react";
import apiClient from "@/services/apiClient";
import AddInvestorModal from "@/components/intelligence/AddInvestorModal";

export default function MatchmakingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All Sectors");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState("match");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Real data state
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchMatchmaking = async () => {
    setLoading(true);
    try {
      // 1. Load the user's startup profile
      const profileRes = await apiClient.get("/api/startup_profile");
      const profile = profileRes.data;

      // 2. Query matchmaking scores using the profile
      const industries = profile?.industry
        ? profile.industry.split(",").map((s: string) => s.trim())
        : ["AI", "SaaS"];

      const matchRes = await apiClient.post("/api/matchmaking", {
        industries: industries,
        stage: profile?.stage || "Seed",
        target_raise: profile?.amount_raising || 500000.0,
      });

      if (matchRes.data && Array.isArray(matchRes.data)) {
        // Map backend MatchResult to frontend Investor
        const mapped: Investor[] = matchRes.data.map((m: any) => ({
          id: m.investor_id,
          name: m.name,
          firm: m.firm,
          role: m.role || "Partner",
          matchScore: m.match_score || 0,
          industries: m.focus || [],
          stages: m.stage ? [m.stage] : [],
          checkSize: m.typical_check || "TBD",
          location: m.location || "Remote",
          whyMatches: m.notes || `${m.name} matches your sectors and raising target from ${m.firm}.`,
          recentInvestments: [],
        }));
        setInvestors(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch matchmaking rankings. Falling back to listing.", err);
      // Fallback: load raw investors
      try {
        const listRes = await apiClient.get("/api/investors");
        if (listRes.data && Array.isArray(listRes.data)) {
          const mapped: Investor[] = listRes.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            firm: m.firm,
            role: m.role || "Partner",
            matchScore: m.interestScore || 70,
            industries: m.focus || [],
            stages: m.stage ? [m.stage] : [],
            checkSize: m.typicalCheck || m.typical_check || "TBD",
            location: m.location || "Remote",
            whyMatches: m.notes || `${m.name} from ${m.firm}.`,
            recentInvestments: [],
          }));
          setInvestors(mapped);
        }
      } catch (fallbackErr) {
        console.error("CRM investors fetch failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchmaking();
  }, []);

  // Clear filters callback
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("All Sectors");
    setSelectedStage("All Stages");
    setSelectedLocation("All Locations");
    setSortBy("match");
    setCurrentPage(1);
  };

  // Filter and sort investors
  const processedInvestors = useMemo(() => {
    let result = [...investors];

    // Search Query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.name.toLowerCase().includes(q) ||
          inv.firm.toLowerCase().includes(q) ||
          inv.role.toLowerCase().includes(q) ||
          inv.whyMatches.toLowerCase().includes(q)
      );
    }

    // Industry filter
    if (selectedIndustry !== "All Sectors") {
      result = result.filter((inv) => inv.industries.includes(selectedIndustry));
    }

    // Stage filter
    if (selectedStage !== "All Stages") {
      result = result.filter((inv) => inv.stages.includes(selectedStage));
    }

    // Location filter
    if (selectedLocation !== "All Locations") {
      result = result.filter((inv) => inv.location === selectedLocation);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "match") {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === "name") {
        return a.firm.localeCompare(b.firm);
      }
      const getCheckNumeric = (str: string, getHigh: boolean) => {
        const cleaned = str.replace(/[$\s,]/g, "");
        const split = cleaned.split("-");
        const valStr = getHigh ? (split[1] || split[0]) : split[0];
        let multiplier = 1000;
        let numPart = valStr;
        if (valStr.endsWith("M")) {
          multiplier = 1000000;
          numPart = valStr.slice(0, -1);
        } else if (valStr.endsWith("K")) {
          multiplier = 1000;
          numPart = valStr.slice(0, -1);
        }
        const val = parseFloat(numPart);
        return isNaN(val) ? 0 : val * multiplier;
      };

      if (sortBy === "check_high") {
        return getCheckNumeric(b.checkSize, true) - getCheckNumeric(a.checkSize, true);
      }
      if (sortBy === "check_low") {
        return getCheckNumeric(a.checkSize, false) - getCheckNumeric(b.checkSize, false);
      }
      return 0;
    });

    return result;
  }, [investors, searchQuery, selectedIndustry, selectedStage, selectedLocation, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(processedInvestors.length / itemsPerPage);
  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedInvestors.slice(startIndex, startIndex + itemsPerPage);
  }, [processedInvestors, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold uppercase tracking-wider">
            <Landmark className="w-4 h-4" />
            <span>Investor Relationship Matching</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Investor Matchmaking
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Match your company's sectors, metrics, and funding demands against our global investor database to identify high-affinity lead syndicates.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm active:scale-98"
        >
          + Add Investor
        </button>
      </div>

      {/* Filter and sorting widgets */}
      <Filters
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={(ind) => {
          setSelectedIndustry(ind);
          setCurrentPage(1);
        }}
        selectedStage={selectedStage}
        setSelectedStage={(s) => {
          setSelectedStage(s);
          setCurrentPage(1);
        }}
        selectedLocation={selectedLocation}
        setSelectedLocation={(l) => {
          setSelectedLocation(l);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onClearFilters={handleClearFilters}
      />

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Found <b>{processedInvestors.length}</b> matches based on your criteria.
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
          Powered by Gemini Embedding Vector matching
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">
            Fetching scored matches from database...
          </span>
        </div>
      ) : paginatedInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedInvestors.map((inv) => (
            <InvestorCard key={inv.id} investor={inv} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-card/10 backdrop-blur-xs min-h-[300px]">
          <Users className="w-12 h-12 text-muted-foreground/60 mb-3" />
          <h4 className="font-bold text-base text-foreground">No investors match your query</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Try adjusting your search criteria, removing some filters, or adding a new investor.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination control footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-6 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-card-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                    : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-card-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Investor Modal Dialog */}
      <AddInvestorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchMatchmaking}
      />
    </div>
  );
}
