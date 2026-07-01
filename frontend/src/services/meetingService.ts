import apiClient from "./apiClient";

export interface ActionItem {
  task: string;
  status: "pending" | "completed";
}

export interface ExtractionOutput {
  investor_name: string;
  firm: string;
  concerns: string[];
  questions: string[];
  next_steps: string[];
  commitments: string;
  sentiment: string;
  interest_level: string;
  follow_up_date: string;
  
  // Frontend fields
  investor: string;
  date: string;
  duration: string;
  summary: string;
  interestLevel: string;
  interestScore: number;
  actionItems: ActionItem[];
}

export interface RecommendationOutput {
  next_best_actions: string[];
  priority: string;
  reason: string;
  deadline: string;
}

export interface ExplanationOutput {
  explanation: string;
}

export interface CommunicationOutput {
  subject: string;
  body: string;
}

/**
 * Sends a transcript as raw text for analysis and information extraction.
 */
export const extractTranscript = async (transcriptText: string, signal?: AbortSignal): Promise<ExtractionOutput> => {
  const { data } = await apiClient.post<ExtractionOutput>("/api/extract", {
    transcript_text: transcriptText,
  }, { signal });
  return data;
};

/**
 * Uploads a text/audio transcript file for analysis and information extraction.
 */
export const extractTranscriptFile = async (file: File, signal?: AbortSignal): Promise<ExtractionOutput> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ExtractionOutput>("/api/extract-file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });
  return data;
};

/**
 * Invokes the Recommendation Agent to produce next best action recommendations.
 */
export const getRecommendations = async (params: {
  investor_profile?: string;
  meeting_summary: string;
  memory?: string;
  past_meetings?: string | string[];
}): Promise<RecommendationOutput> => {
  const { data } = await apiClient.post<RecommendationOutput>("/api/recommend", params);
  return data;
};

/**
 * Invokes the Explanation Agent to compute matching compatibility and detail explanations.
 */
export const getExplanation = async (params: {
  recommendation: string;
  investor_memory?: string;
  meeting_history?: string;
}): Promise<ExplanationOutput> => {
  const { data } = await apiClient.post<ExplanationOutput>("/api/explain", params);
  return data;
};

/**
 * Invokes the Communication Agent to draft targeted follow-up email contents.
 */
export const getCommunicationDraft = async (params: {
  investor_name: string;
  communication_type: string;
  tone: string;
  context?: string;
  meeting_context?: string;
  founder_message?: string;
  attachments?: string[];
  additional_instructions?: string;
}): Promise<CommunicationOutput> => {
  const { data } = await apiClient.post<CommunicationOutput>("/api/communication", params);
  return data;
};

/**
 * Persists the extracted meeting analysis details and registers it to CRM.
 */
export const persistMeeting = async (params: {
  investor_id?: string;
  investor_name: string;
  firm: string;
  transcript: string;
  summary: string;
  date: string;
  duration?: string;
  sentiment?: string;
  interest_level?: string;
  interest_score?: number;
  concerns?: string[];
  questions?: string[];
  next_steps?: string[];
  action_items?: ActionItem[];
  follow_up_date?: string;
  recommendations?: string[];
  recommendation_reason?: string;
  recommendation_priority?: string;
  recommendation_deadline?: string;
}): Promise<any> => {
  const { data } = await apiClient.post("/api/meetings/persist", params);
  return data;
};
