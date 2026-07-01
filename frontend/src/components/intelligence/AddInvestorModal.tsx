"use client";

import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddInvestorModal({ isOpen, onClose, onSuccess }: AddInvestorModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("Investor");
  const [stage, setStage] = useState("Seed");
  const [location, setLocation] = useState("");
  const [typicalCheck, setTypicalCheck] = useState("");
  const [focusInput, setFocusInput] = useState("");
  const [status, setStatus] = useState("Pipeline Lead");
  const [interestScore, setInterestScore] = useState(70);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firm.trim()) {
      toast.showError("Name and Venture Firm are required.");
      return;
    }
    setLoading(true);

    const focus = focusInput
      ? focusInput.split(",").map((f) => f.trim())
      : [];

    try {
      await apiClient.post("/api/investors", {
        name: name.trim(),
        firm: firm.trim(),
        role: role.trim(),
        stage: stage.trim(),
        location: location.trim(),
        typical_check: typicalCheck.trim(),
        focus: focus,
        status: status,
        interest_score: Number(interestScore),
        notes: notes.trim(),
      });
      toast.showSuccess(`Added investor ${name} to database.`);
      
      // Seed a generic relationship memory
      try {
        const listResponse = await apiClient.get("/api/investors");
        const addedInv = listResponse.data.find((inv: any) => inv.name === name.trim());
        if (addedInv) {
          await apiClient.post("/api/memory", {
            investor_id: addedInv.id,
            memory: `Relationship established with ${name} from ${firm}. Typical check size: ${typicalCheck}.`,
            memory_type: "relationship_note"
          });
        }
      } catch (err) {
        console.warn("Failed to create default relationship memory:", err);
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || "Failed to create investor.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setFirm("");
    setRole("Investor");
    setStage("Seed");
    setLocation("");
    setTypicalCheck("");
    setFocusInput("");
    setStatus("Pipeline Lead");
    setInterestScore(70);
    setNotes("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            <span>Add Investor to CRM</span>
          </h3>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Investor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sravya"
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
                placeholder="e.g. Alpha Capital"
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Role</label>
              <input
                type="text"
                placeholder="e.g. Partner"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Investment Stage</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Typical Check Size</label>
              <input
                type="text"
                placeholder="e.g. $250K - $500K"
                value={typicalCheck}
                onChange={(e) => setTypicalCheck(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">CRM Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              >
                <option value="Pipeline Lead">Pipeline Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Pitching">Pitching</option>
                <option value="Due Diligence">Due Diligence</option>
                <option value="Passed">Passed</option>
                <option value="Soft Committed">Soft Committed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground block">Interest Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={interestScore}
                onChange={(e) => setInterestScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground block">Focus Areas (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. AI, SaaS, Data Infrastructure"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground block">Interaction Notes</label>
            <textarea
              placeholder="Enter context, background info, or intro summaries..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onClose(); resetForm(); }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" isLoading={loading}>
              Add Investor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
