"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCommunicationDraft } from "@/hooks/useMeetingIntelligence";
import apiClient from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCw,
  Mail,
  User,
  Sliders,
  Type,
  Minimize2,
  Maximize2,
  Trash2,
  Paperclip,
  Image,
  Link,
  Loader2,
  FileText
} from "lucide-react";

function FollowupsContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [selectedInvestor, setSelectedInvestor] = useState("");
  const [investors, setInvestors] = useState<any[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);

  // Form Field Inputs
  const [meetingContext, setMeetingContext] = useState("");
  const [founderMessage, setFounderMessage] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  // Composer Output states
  const [communicationType, setCommunicationType] = useState("Follow-up Email");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const { execute: getDraft } = useCommunicationDraft();

  // 1. Fetch CRM investors on load
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const response = await apiClient.get("/api/investors");
        if (response.data && Array.isArray(response.data)) {
          setInvestors(response.data);
          
          // Auto-select based on route params or select first
          const recipient = searchParams.get("recipient");
          const draftId = searchParams.get("draft");
          let initialSelection = response.data[0]?.name || "General / Other";

          if (draftId === "f1" || recipient === "Alfred Lin" || recipient === "sravya") {
            const found = response.data.find(i => i.name.toLowerCase().includes("sravya") || i.name === recipient);
            if (found) initialSelection = found.name;
          } else if (recipient) {
            const found = response.data.find(i => i.name === recipient);
            if (found) initialSelection = found.name;
          }
          setSelectedInvestor(initialSelection);
        }
      } catch (err) {
        console.warn("Failed to fetch CRM investors, using seed fallback list.", err);
        const fallback = [
          { id: "p1", name: "sravya", firm: "Alpha Capital" },
          { id: "p2", name: "deepthi", firm: "Beta Ventures" },
          { id: "p3", name: "anushka", firm: "Gamma Seed" },
        ];
        setInvestors(fallback);
        setSelectedInvestor(fallback[0].name);
      }
    };
    fetchInvestors();
  }, [searchParams]);

  // 2. Fetch context when selection changes
  useEffect(() => {
    if (!selectedInvestor) return;

    const fetchContext = async () => {
      setLoadingContext(true);
      try {
        const draftId = searchParams.get("draft");
        const url = `/api/followups/context?investor_name=${encodeURIComponent(selectedInvestor)}` + 
          (draftId ? `&draft_id=${draftId}` : "");
        const response = await apiClient.get(url);
        if (response.data) {
          setMeetingContext(response.data.meeting_context || "");
          setFounderMessage(response.data.founder_message || "");
          setAttachments(response.data.attachments || []);
          if (response.data.subject) {
            setSubject(response.data.subject);
          }
          if (response.data.body) {
            setBody(response.data.body);
          }
        }
      } catch (err) {
        console.warn("Failed to load context for composer.", err);
      } finally {
        setLoadingContext(false);
      }
    };
    fetchContext();
  }, [selectedInvestor, searchParams]);

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleDriveClick = () => {
    const url = prompt("Enter Google Drive URL to share:");
    if (url) {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        setBody(prev => `${prev}\n\n[Google Drive Resource](${url})`);
        toast.showSuccess("Google Drive link appended successfully!");
      } else {
        toast.showError("Invalid URL format.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const toastId = toast.showLoading(`Uploading ${selectedFile.name}...`);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await apiClient.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        const fileUrl = response.data.url || "#";
        const fileName = response.data.file_name || selectedFile.name;
        
        setAttachments(prev => [...prev, fileName]);
        if (isImage) {
          setBody(prev => `${prev}\n\n![Uploaded Image: ${fileName}](${fileUrl})`);
        } else {
          setBody(prev => `${prev}\n\n[Attachment: ${fileName}](${fileUrl})`);
        }
        toast.dismissToast(toastId);
        toast.showSuccess("Uploaded successfully and appended to body!");
      } catch (err: any) {
        toast.dismissToast(toastId);
        toast.showError(err.message || "Upload failed.");
      }
    }
  };

  const handleSendMail = async () => {
    setSending(true);
    const matchedInv = investors.find(i => i.name === selectedInvestor);
    const investorId = matchedInv ? matchedInv.id : "p1";
    
    const draftId = searchParams.get("draft");
    
    try {
      await apiClient.post("/api/send-email", {
        investor_id: investorId,
        subject: subject,
        body: body,
        tone: tone,
        type: communicationType,
        draft_id: draftId ? parseInt(draftId) : undefined
      });
      toast.showSuccess("Mail Sent successfully! Logged to CRM Activity timeline.");
    } catch (err: any) {
      toast.showError(err.message || "Failed to dispatch email.");
    } finally {
      setSending(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Direct POST payload matching CommunicationRequest schema
      const result = await apiClient.post("/api/communication", {
        investor_name: selectedInvestor,
        communication_type: communicationType,
        tone: tone,
        meeting_context: meetingContext,
        founder_message: founderMessage,
        attachments: attachments,
        additional_instructions: additionalInstructions
      });
      
      if (result.data) {
        setSubject(result.data.subject || "");
        setBody(result.data.body || "");
      }
    } catch (err: any) {
      toast.showError(err.message || "Failed to generate AI draft.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12 font-sans text-xs">
      {/* Header section */}
      <div className="flex flex-col gap-1.5 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold uppercase tracking-wider">
          <Mail className="w-4 h-4" />
          <span>Follow-up & Communication Agent</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Communication Drafts
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Draft highly tailored, contextual follow-ups based on investor preferences, conversation transcripts, and specific deliverable metrics.
        </p>
      </div>

      {/* Main double column: Controls (Left 1 col) & Gmail Composer UI (Right 2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Generator Controls Panel (Left 1 col) */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border/50 bg-card/45 dark:bg-card/25 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Compose Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Select Recipient */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Select Investor Context</span>
                </label>
                <select
                  value={selectedInvestor}
                  onChange={(e) => setSelectedInvestor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground cursor-pointer font-semibold"
                >
                  {investors.map((inv) => (
                    <option key={inv.id || inv.name} value={inv.name}>
                      {inv.name} {inv.firm ? `(${inv.firm})` : ""}
                    </option>
                  ))}
                  <option value="General / Other">General / Warm Outbound</option>
                </select>
              </div>

              {/* Select Communication Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Document & Type</span>
                </label>
                <select
                  value={communicationType}
                  onChange={(e) => setCommunicationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground cursor-pointer font-semibold"
                >
                  <option value="Follow-up Email">Follow-up Email</option>
                  <option value="Investor Update">Investor Update</option>
                  <option value="Meeting Summary">Meeting Summary</option>
                  <option value="Thank-you Email">Thank-you Email</option>
                </select>
              </div>

              {/* Tone Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  <span>Communication Tone</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "Professional", label: "Professional" },
                    { val: "Friendly", label: "Friendly" },
                    { val: "Formal", label: "Formal" },
                    { val: "Concise", label: "Concise" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setTone(t.val)}
                      className={`py-2 px-3 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        tone === t.val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-accent hover:text-foreground text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Context Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Meeting Context / Summary</span>
                </label>
                {loadingContext ? (
                  <div className="flex items-center justify-center p-3 border border-dashed border-border/40 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    placeholder="Prefilled summary of the last meeting..."
                    value={meetingContext}
                    onChange={(e) => setMeetingContext(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold resize-none"
                  />
                )}
              </div>

              {/* Founder Message Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80">Founder Message Preset</label>
                <textarea
                  rows={2}
                  placeholder="Key message points to incorporate..."
                  value={founderMessage}
                  onChange={(e) => setFounderMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold resize-none"
                />
              </div>

              {/* Additional Instructions */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground/80">Additional Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. emphasize our SaaS ARR growth..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold resize-none"
                />
              </div>

              {/* Attachments Display */}
              {attachments.length > 0 && (
                <div className="space-y-1 border-t border-border/40 pt-2">
                  <span className="font-bold text-muted-foreground block mb-1">Uploaded Attachments</span>
                  <div className="flex flex-wrap gap-1">
                    {attachments.map((file, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground font-semibold text-[9px] border border-border/60">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 w-full">
                <Button
                  onClick={handleGenerate}
                  isLoading={generating}
                  className="w-full text-xs font-bold gap-1.5 h-10 shadow-lg shadow-indigo-500/10"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Draft</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composer Board (Right 2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border-border shadow-md overflow-hidden bg-card">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white dark:bg-slate-950">
              <span className="text-xs font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>New Message — Drafted by Chief of Staff Agent</span>
              </span>
              <div className="flex items-center gap-3 text-slate-400">
                <Minimize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                <Maximize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                <button onClick={handleGenerate} title="Regenerate" className="hover:text-white cursor-pointer">
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Email Meta Info Fields */}
            <div className="divide-y divide-border border-b border-border text-xs">
              <div className="flex items-center px-4 py-2.5">
                <span className="w-12 text-muted-foreground font-bold">To:</span>
                <span className="font-semibold text-foreground">
                  {selectedInvestor === "General / Other"
                    ? "investor@venturefund.com"
                    : `${selectedInvestor.toLowerCase().replace(/\s+/g, "")}@venture.com`}
                </span>
              </div>
              <div className="flex items-center px-4 py-2.5">
                <span className="w-12 text-muted-foreground font-bold">Subject:</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-0 focus:outline-hidden focus:ring-0 text-foreground font-semibold"
                />
              </div>
            </div>

            {/* Rich Text Content Area */}
            <div className="p-4 bg-background/30">
              {generating ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
                  <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 animate-spin">
                    <RotateCw className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Drafting responsive message with tone presets...</span>
                  <span className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                    Gemini is referencing your database startup profile and specific meeting contexts.
                  </span>
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={15}
                  className="w-full bg-transparent border-0 p-0 focus:outline-hidden focus:ring-0 text-xs leading-relaxed text-foreground/95 resize-none font-sans font-medium"
                />
              )}
            </div>

            {/* Hidden Inputs for Uploader */}
            <input
              type="file"
              ref={attachmentInputRef}
              className="hidden"
              onChange={(e) => handleFileChange(e, false)}
            />
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
            />

            {/* Compose Footer Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50 dark:bg-slate-900/35">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSendMail}
                  isLoading={sending}
                  className="h-8 text-xs font-bold px-4 gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-500"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </Button>
                
                <div className="flex items-center gap-1 border-l border-border/80 pl-2">
                  <button
                    onClick={handleAttachmentClick}
                    type="button"
                    title="Upload File Attachment"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDriveClick}
                    type="button"
                    title="Add Google Drive Resource"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleImageClick}
                    type="button"
                    title="Upload Image"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 text-[11px] gap-1.5 border-border/60 hover:bg-accent hover:text-foreground"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Email"}</span>
                </Button>

                <button
                  className="p-2 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors"
                  title="Delete Draft"
                  onClick={() => { setSubject(""); setBody(""); }}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default function FollowupsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] text-center">
        <span className="text-xs text-muted-foreground animate-pulse">Loading Composer...</span>
      </div>
    }>
      <FollowupsContent />
    </Suspense>
  );
}
