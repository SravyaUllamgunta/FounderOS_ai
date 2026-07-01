"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, X, Shield, Coins, Users, Landmark } from "lucide-react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

interface StartupProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function StartupProfileModal({ isOpen, onClose, onSuccess }: StartupProfileModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form Fields
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("Seed");
  const [amountRaising, setAmountRaising] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [arr, setArr] = useState(0);
  const [description, setDescription] = useState("");

  // Checklist Checkboxes
  const [hasDeck, setHasDeck] = useState(false);
  const [hasFinancialModel, setHasFinancialModel] = useState(false);
  const [hasCapTable, setHasCapTable] = useState(false);
  const [hasOnePager, setHasOnePager] = useState(false);
  const [hasLegalSetup, setHasLegalSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const response = await apiClient.get("/api/startup_profile");
      if (response.data) {
        const d = response.data;
        setIndustry(d.industry || "");
        setStage(d.stage || "Seed");
        setAmountRaising(d.amount_raising || 0);
        setTeamSize(d.team_size || 0);
        setArr(d.arr || 0);
        setDescription(d.description || "");
        setHasDeck(!!d.has_deck);
        setHasFinancialModel(!!d.has_financial_model);
        setHasCapTable(!!d.has_cap_table);
        setHasOnePager(!!d.has_one_pager);
        setHasLegalSetup(!!d.has_legal_setup);
      }
    } catch (err) {
      console.error("Failed to load startup profile.", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/api/startup_profile", {
        industry,
        stage,
        amount_raising: Number(amountRaising),
        team_size: Number(teamSize),
        arr: Number(arr),
        description,
        has_deck: hasDeck,
        has_financial_model: hasFinancialModel,
        has_cap_table: hasCapTable,
        has_one_pager: hasOnePager,
        has_legal_setup: hasLegalSetup,
      });
      toast.showSuccess("Startup profile updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.showError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Enter Startup Information</span>
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
            Loading startup details...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Target Industries *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI, SaaS, Data Engineering (comma-separated)"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">Funding Stage *</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">Amount Raising ($) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000000"
                  value={amountRaising}
                  onChange={(e) => setAmountRaising(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">Team Size</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground block">Annual Recurring Revenue (ARR) ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={arr}
                  onChange={(e) => setArr(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Description</label>
              <textarea
                placeholder="Briefly describe what your company builds..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold resize-none"
              />
            </div>

            {/* Checklist booleans */}
            <div className="space-y-2 border-t border-border/40 pt-3">
              <label className="font-bold text-foreground block mb-1.5">Fundraising Readiness Assets</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  { label: "Pitch Deck Refined", state: hasDeck, setter: setHasDeck },
                  { label: "Financial Model", state: hasFinancialModel, setter: setHasFinancialModel },
                  { label: "Cap Table", state: hasCapTable, setter: setHasCapTable },
                  { label: "One Pager", state: hasOnePager, setter: setHasOnePager },
                  { label: "Legal Setup", state: hasLegalSetup, setter: setHasLegalSetup },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-muted/30 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" isLoading={loading}>
                Save Profile
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
