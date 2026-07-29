// ============================================================
// Chatbot Service — API calls for the guided chatbot
// ============================================================

import axiosClient from "../lib/axiosClient";

// ─── Types ───────────────────────────────────────────────

export interface ChatbotHealth {
  service: string;
  mode: string;
  geminiConfigured: boolean;
  timestamp: string;
}

export interface MenuOption {
  id: string;
  label: string;
  action: string;
}

export interface FlowStepOption {
  label: string;
  value: string | number | null;
}

export interface FlowStep {
  id: string;
  label: string;
  required: boolean;
  options: FlowStepOption[];
}

export interface Flow {
  id: string;
  title: string;
  submitAction: string;
  steps: FlowStep[];
}

export interface ChatbotMenu {
  greeting: string;
  options: MenuOption[];
  flows: Record<string, Flow>;
}

export interface SessionResponse {
  sessionId: string;
  createdAt: string;
}

export interface ChatbotMessageRequest {
  sessionId: string;
  message: string;
  action: string;
  answers: Record<string, string | number | null>;
}

export interface ChatbotMessageResponse {
  status: string;
  data: {
    reply: string;
    options?: MenuOption[];
    flow?: Flow;
    sessionId: string;
  };
}

// ─── API Calls ───────────────────────────────────────────

const CHATBOT_BASE = "/chatbot";

/**
 * GET /chatbot/health — Check chatbot mode and Gemini configuration
 */
export async function getChatbotHealth(): Promise<ChatbotHealth> {
  const { data } = await axiosClient.get(`${CHATBOT_BASE}/health`);
  return data.data;
}

/**
 * GET /chatbot/menu — Get the customer menu and select-based flow definitions
 */
export async function getChatbotMenu(): Promise<ChatbotMenu> {
  const { data } = await axiosClient.get(`${CHATBOT_BASE}/menu`);
  return data.data;
}

/**
 * POST /chatbot/sessions — Start an anonymous or authenticated chatbot session
 */
export async function createChatbotSession(
  sessionId?: string,
): Promise<SessionResponse> {
  const { data } = await axiosClient.post(`${CHATBOT_BASE}/sessions`, {
    sessionId,
  });
  return data.data;
}

/**
 * POST /chatbot/messages — Send free text or a guided chatbot action
 */
export async function sendChatbotMessage(
  payload: ChatbotMessageRequest,
): Promise<ChatbotMessageResponse> {
  const { data } = await axiosClient.post(`${CHATBOT_BASE}/messages`, payload);
  return data;
}