import { useState, useCallback } from "react";
import axios from "axios";
import * as meetingService from "@/services/meetingService";
import { useToast } from "@/context/ToastContext";

/**
 * Reusable React hook for extracting information from a text transcript.
 */
export function useExtractTranscript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<meetingService.ExtractionOutput | null>(null);
  const toast = useToast();

  const execute = useCallback(async (transcriptText: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const toastId = toast.showLoading("Analyzing transcript text...");
    try {
      const result = await meetingService.extractTranscript(transcriptText, signal);
      setData(result);
      toast.dismissToast(toastId);
      toast.showSuccess("Meeting transcript analyzed successfully!");
      return result;
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.message === "canceled") {
        toast.dismissToast(toastId);
        throw err;
      }
      const msg = err.message || "Failed to extract transcript details.";
      setError(msg);
      toast.dismissToast(toastId);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, execute, setData };
}

/**
 * Reusable React hook for uploading and extracting information from a transcript file.
 */
export function useExtractTranscriptFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<meetingService.ExtractionOutput | null>(null);
  const toast = useToast();

  const execute = useCallback(async (file: File, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const toastId = toast.showLoading(`Uploading and parsing ${file.name}...`);
    try {
      const result = await meetingService.extractTranscriptFile(file, signal);
      setData(result);
      toast.dismissToast(toastId);
      toast.showSuccess("Call audio / transcript parsed successfully!");
      return result;
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.message === "canceled") {
        toast.dismissToast(toastId);
        throw err;
      }
      const msg = err.message || "Failed to upload and analyze transcript file.";
      setError(msg);
      toast.dismissToast(toastId);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, execute, setData };
}

/**
 * Reusable React hook for running the Recommendation Agent.
 */
export function useRecommendations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<meetingService.RecommendationOutput | null>(null);
  const toast = useToast();

  const execute = useCallback(async (params: {
    investor_profile?: string;
    meeting_summary: string;
    memory?: string;
    past_meetings?: string | string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await meetingService.getRecommendations(params);
      setData(result);
      return result;
    } catch (err: any) {
      const msg = err.message || "Failed to fetch AI action recommendations.";
      setError(msg);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, execute, setData };
}

/**
 * Reusable React hook for running the Explanation Agent.
 */
export function useExplanation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<meetingService.ExplanationOutput | null>(null);
  const toast = useToast();

  const execute = useCallback(async (params: {
    recommendation: string;
    investor_memory?: string;
    meeting_history?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await meetingService.getExplanation(params);
      setData(result);
      return result;
    } catch (err: any) {
      const msg = err.message || "Failed to generate matchmaking explanation.";
      setError(msg);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, execute, setData };
}

/**
 * Reusable React hook for drafting communications / follow-up documents.
 */
export function useCommunicationDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<meetingService.CommunicationOutput | null>(null);
  const toast = useToast();

  const execute = useCallback(async (params: {
    investor_name: string;
    communication_type: string;
    tone: string;
    context?: string;
  }) => {
    setLoading(true);
    setError(null);
    const toastId = toast.showLoading("Drafting contextual follow-up materials...");
    try {
      const result = await meetingService.getCommunicationDraft(params);
      setData(result);
      toast.dismissToast(toastId);
      toast.showSuccess(`${params.communication_type} compiled with ${params.tone} tone!`);
      return result;
    } catch (err: any) {
      const msg = err.message || "Failed to generate follow-up document.";
      setError(msg);
      toast.dismissToast(toastId);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, execute, setData };
}

/**
 * Reusable React hook for persisting meeting analysis results.
 */
export function usePersistMeeting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const execute = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);
    const toastId = toast.showLoading("Saving meeting to CRM database...");
    try {
      const result = await meetingService.persistMeeting(params);
      toast.dismissToast(toastId);
      toast.showSuccess("Meeting, memories, and follow-ups saved to CRM!");
      return result;
    } catch (err: any) {
      const msg = err.message || "Failed to save meeting.";
      setError(msg);
      toast.dismissToast(toastId);
      toast.showError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { loading, error, execute };
}
