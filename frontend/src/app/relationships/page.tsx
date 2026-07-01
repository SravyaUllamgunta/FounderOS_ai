"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/services/apiClient";
import {
  History,
  MapPin,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Search,
  Filter,
  Loader2,
  DollarSign,
  UserPlus
} from "lucide-react";

interface Investor {
  id: string;
  name: string;
  firm: string;
  role: string;
  status: string;
  lastContact: string;
  location: string;
  typicalCheck: string;
  preferences: string[];
  notes: string;
  interestScore: number;
}

const MOCK_INVESTORS: Investor[] = [
  {
    id: "p1",
    name: "Kunal Bahl",
    firm: "Titan Capital",
    role: "Co-Founder & Partner",
    status: "Active Diligence",
    lastContact: "Today",
    location: "New Delhi, India",
    typicalCheck: "₹25L - ₹1.5Cr",
    preferences: ["Developer Tools", "AI First SaaS", "No warm intro required"],
    notes: "Keen interest in automated CRM updates and custom workflow builders.",
    interestScore: 88,
  },
  {
    id: "p2",
    name: "Vani Kola",
    firm: "Kalaari Capital",
    role: "Managing Director",
    status: "Soft Committed",
    lastContact: "Yesterday",
    location: "Bengaluru, India",
    typicalCheck: "₹2Cr - ₹8Cr",
    preferences: ["Generative AI", "Enterprise SaaS", "Prefers early traction stats"],
    notes: "Soft committed ₹1.5Cr on standard pre-seed terms.",
    interestScore: 92,
  },
  {
    id: "p3",
    name: "Ritesh Agarwal",
    firm: "OYO / Angel Investor",
    role: "Founder & CEO / Angel",
    status: "Soft Committed",
    lastContact: "2 days ago",
    location: "Gurugram, India",
    typicalCheck: "₹10L - ₹50L",
    preferences: ["Hospitality Tech", "B2C AI Agents", "Very fast check writer"],
    notes: "Soft committed ₹30L on standard SAFE agreement.",
    interestScore: 95,
  },
  {
    id: "p4",
    name: "Shailendra Singh",
    firm: "Peak XV Partners",
    role: "Managing Director",
    status: "Active Diligence",
    lastContact: "3 days ago",
    location: "Bengaluru, India",
    typicalCheck: "₹8Cr - ₹30Cr",
    preferences: ["Deep Tech", "AI Infrastructure", "Leads Series A/B"],
    notes: "Evaluating for peak XV pre-seed accelerator program.",
    interestScore: 84,
  },
  {
    id: "p5",
    name: "Alfred Lin",
    firm: "Sequoia Capital",
    role: "Partner",
    status: "Active Diligence",
    lastContact: "June 27, 2026",
    location: "San Francisco, CA",
    typicalCheck: "₹4Cr - ₹16Cr",
    preferences: ["AI Chief of Staff", "Security first", "Likes fast scaling"],
    notes: "Alfred requested pre-seed SAFE drafts and vector storage security details.",
    interestScore: 92,
  },
  {
    id: "p6",
    name: "Kirsten Green",
    firm: "Forerunner Ventures",
    role: "Founder & Partner",
    status: "Soft Committed",
    lastContact: "June 25, 2026",
    location: "New York, NY",
    typicalCheck: "₹4Cr - ₹12Cr",
    preferences: ["Consumer Enablement", "Transaction SaaS", "Commerce pipelines"],
    notes: "Curious about B2B2C transaction network effect, requested Q3 engineering roadmap.",
    interestScore: 78,
  }
];

export default function RelationshipsListPage() {
  const toast = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Onboarding Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Active Diligence");
  const [location, setLocation] = useState("");
  const [typicalCheck, setTypicalCheck] = useState("");
  const [preferencesStr, setPreferencesStr] = useState("");
  const [notes, setNotes] = useState("");
  const [interestScore, setInterestScore] = useState(50);
  const [saving, setSaving] = useState(false);

  const fetchInvestors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Investor[]>("/api/investors");
      setInvestors(response.data);
    } catch (err: any) {
      console.warn("Backend unavailable. Falling back to mock relationship profiles.", err);
      const stored = typeof window !== "undefined" ? localStorage.getItem("local_investors") : null;
      if (stored) {
        setInvestors(JSON.parse(stored));
      } else {
        setInvestors(MOCK_INVESTORS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const resetForm = () => {
    setName("");
    setFirm("");
    setRole("");
    setStatus("Active Diligence");
    setLocation("");
    setTypicalCheck("");
    setPreferencesStr("");
    setNotes("");
    setInterestScore(50);
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firm.trim() || !role.trim()) {
      toast.showError("Name, Firm, and Role are required.");
      return;
    }

    setSaving(true);
    const newRelationshipData = {
      name,
      firm,
      role,
      status,
      location: location || "India",
      typical_check: typicalCheck || "₹25L",
      preferences: preferencesStr ? preferencesStr.split(",").map(p => p.trim()) : ["Early Stage"],
      notes: notes || "Newly added investor relationship.",
      interest_score: Number(interestScore)
    };

    try {
      await apiClient.post("/api/investors", newRelationshipData);
      toast.showSuccess(`Added relationship profile for ${name}!`);
      setIsModalOpen(false);
      resetForm();
      fetchInvestors();
    } catch (err: any) {
      console.warn("Backend down. Saving new relationship profile locally.", err);
      
      const currentList = [...investors];
      const newLocalId = `p_local_${Date.now()}`;
      const newLocalRelationship: Investor = {
        id: newLocalId,
        name: name,
        firm: firm,
        role: role,
        status: status,
        lastContact: "Just added",
        location: location || "India",
        typicalCheck: typicalCheck || "₹25L",
        preferences: preferencesStr ? preferencesStr.split(",").map(p => p.trim()) : ["Early Stage"],
        notes: notes || "Newly added investor relationship.",
        interestScore: Number(interestScore)
      };
      
      const updatedList = [newLocalRelationship, ...currentList];
      setInvestors(updatedList);
      localStorage.setItem("local_investors", JSON.stringify(updatedList));
      
      const mockDetailItem = {
        id: newLocalId,
        name: name,
        firm: firm,
        role: role,
        status: status,
        lastContact: "Just added",
        location: location || "India",
        typicalCheck: typicalCheck || "₹25L",
        preferences: preferencesStr ? preferencesStr.split(",").map(p => p.trim()) : ["Early Stage"],
        notes: notes || "Newly added investor relationship.",
        interestScore: Number(interestScore),
        meetings: [],
        recommendations: [],
        notesList: [],
        reminders: [],
        emails: [],
        timeline: [
          {
            id: `act_${Date.now()}`,
            type: "meeting",
            title: "Relationship Initialized",
            date: "Just now",
            description: `New investor profile created for ${name} at ${firm}.`,
            author: "Jane Doe",
            tags: ["Onboarding"]
          }
        ],
        tasks: []
      };
      
      localStorage.setItem(`local_detail_${newLocalId}`, JSON.stringify(mockDetailItem));

      toast.showSuccess(`Added relationship profile for ${name} locally!`);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active Diligence":
        return "border-indigo-500/25 bg-indigo-500/10 text-indigo-500";
      case "Soft Committed":
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-500";
      case "Passed":
        return "border-rose-500/25 bg-rose-500/10 text-rose-500";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

  // Filter list
  const filteredInvestors = investors.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.firm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Relationship Memory & CRM Logs</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Relationship Memory
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Review historical milestones, meeting notes, tone preferences, and actionable next steps organized as a vertical social activity timeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-9 gap-1 border-dashed cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Relationship</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/45 dark:bg-card/25 p-4 rounded-xl border border-border/50 backdrop-blur-xs text-xs">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by investor name, firm, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-medium text-foreground"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-semibold cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Active Diligence">Active Diligence</option>
            <option value="Soft Committed">Soft Committed</option>
            <option value="Pipeline Lead">Pipeline Lead</option>
            <option value="Passed">Passed</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">Loading relationships...</span>
        </div>
      ) : filteredInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestors.map((inv) => (
            <Card key={inv.id} className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {inv.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground leading-snug">{inv.name}</h4>
                      <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{inv.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] px-2 py-0.5 font-bold uppercase ${getStatusBadge(inv.status)}`}>
                    {inv.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 text-xs">
                  {/* Firm & Ticket */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{inv.firm}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-emerald-500">₹</span>
                      <span>{inv.typicalCheck} Check</span>
                    </div>
                  </div>
                  
                  {/* Location & Last contact */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{inv.location}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      Last: <b>{inv.lastContact}</b>
                    </div>
                  </div>

                  {/* Summary note */}
                  <p className="text-[11px] text-muted-foreground/80 leading-normal bg-background/50 border border-border/30 p-2.5 rounded-lg line-clamp-2">
                    {inv.notes}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-bold">Interest:</span>
                    <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {inv.interestScore}%
                    </span>
                  </div>
                  
                  <Link href={`/relationships/${inv.id}`}>
                    <Button size="sm" className="h-7 text-[10px] gap-1 px-3">
                      <span>View Memory</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card/25 rounded-2xl border border-border/40">
          <UserPlus className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-foreground">No matching relationships found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      )}

      {/* Onboarding Add Relationship Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                <span>Add Relationship Profile</span>
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRelationship} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anupam Mittal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Venture Firm *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shaadi.com / Angel"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Founder & Partner"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-bold cursor-pointer"
                  >
                    <option value="Active Diligence">Active Diligence</option>
                    <option value="Soft Committed">Soft Committed</option>
                    <option value="Pipeline Lead">Pipeline Lead</option>
                    <option value="Passed">Passed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Typical Check size</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹20L - ₹50L"
                    value={typicalCheck}
                    onChange={(e) => setTypicalCheck(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2 space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Preferences / Focus tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SaaS, Fintech, Consumer AI"
                    value={preferencesStr}
                    onChange={(e) => setPreferencesStr(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">Interest Score ({interestScore}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={interestScore}
                    onChange={(e) => setInterestScore(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-8 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">Notes / Initial Diligence Details</label>
                <textarea
                  placeholder="e.g. Exited founder, highly technical. Expressed interest in developer AI agents."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-sans resize-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Save Relationship
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
