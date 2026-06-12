const BASE_URL = `http://${window.location.hostname}:8000`;

function getHeaders() {
  const token = localStorage.getItem("causalguard_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Server communication error occurred");
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    register: (data: any) => request<any>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    login: (data: any) => request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getProfile: () => request<any>("/api/user/profile", {
      method: "GET",
    }),
    verifyId: (data: any) => request<any>("/api/verify-id", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },

  // Guardians
  guardians: {
    invite: (data: any) => request<any>("/api/guardian/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    approve: (data: any) => request<any>("/api/guardian/approve", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    updatePermissions: (data: any) => request<any>("/api/guardian/permissions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getMyGuardians: () => request<any[]>("/api/guardian/my-guardians", {
      method: "GET",
    }),
    getMyWards: () => request<any[]>("/api/guardian/my-wards", {
      method: "GET",
    }),
    getActiveJourneys: () => request<any[]>("/api/guardian/active-journeys", {
      method: "GET",
    }),
  },

  // Journeys and Maps
  journey: {
    getNearbyPolice: () => request<any[]>("/api/map/nearby-police", {
      method: "GET",
    }),
    getNearbyHealthcare: () => request<any[]>("/api/map/nearby-healthcare", {
      method: "GET",
    }),
    recommendRoutes: (data: any) => request<any>("/api/route/recommend", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getRiskScore: (data: any) => request<any>("/api/route/risk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    startJourney: (data: any) => request<any>("/api/journey/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    updateLocation: (data: any) => request<any>("/api/journey/update-location", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    endJourney: (data: any) => request<any>("/api/journey/end", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },

  // Voice Assistant
  voice: {
    sendCommand: (command: string, language: string) => request<any>("/api/voice/command", {
      method: "POST",
      body: JSON.stringify({ command, language }),
    }),
  },

  // Emergency & Police
  emergency: {
    triggerSOS: (data: any) => request<any>("/api/sos/trigger", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    checkResponse: (data: any) => request<any>("/api/sos/check-response", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    requestProtection: (data: any) => request<any>("/api/police/protection-request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getPoliceAlerts: () => request<any[]>("/api/police/alerts", {
      method: "GET",
    }),
    updateAlertStatus: (data: any) => request<any>("/api/police/update-status", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },

  // News Alerts
  news: {
    getSafetyAlerts: () => request<any[]>("/api/news/safety-alerts", {
      method: "GET",
    }),
    refreshNews: () => request<any>("/api/news/refresh", {
      method: "POST",
    }),
  },

  // Health Safety
  health: {
    updateProfile: (data: any) => request<any>("/api/health/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    toggleMode: (isActive: boolean) => request<any>("/api/health/mode", {
      method: "POST",
      body: JSON.stringify({ is_active: isActive }),
    }),
    getNearbySupport: () => request<any>("/api/health/nearby-support", {
      method: "GET",
    }),
  },

  // Cab & Auto Safety
  cab: {
    startMonitoring: (data: any) => request<any>("/api/cab/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    checkDeviation: (data: any) => request<any>("/api/cab/deviation-check", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },

  // Digital Safety
  harassment: {
    checkMessage: (text: string) => request<any>("/api/harassment/check", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  },

  // Evidence Locker
  evidence: {
    create: (data: any) => request<any>("/api/evidence/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    list: () => request<any[]>("/api/evidence/list", {
      method: "GET",
    }),
    delete: (id: number) => request<any>(`/api/evidence/${id}`, {
      method: "DELETE",
    }),
  },

  // Privacy Settings
  privacy: {
    getSettings: () => request<any>("/api/privacy/settings", {
      method: "GET",
    }),
    updateSettings: (consentPreferencesJson: string) => request<any>("/api/privacy/settings", {
      method: "POST",
      body: JSON.stringify({ consent_preferences: consentPreferencesJson }),
    }),
    purgeHistory: () => request<any>("/api/privacy/purge-history", {
      method: "POST",
    }),
  },

  // Continual Learning Feedback
  feedback: {
    submitJourneyFeedback: (data: any) => request<any>("/api/feedback/journey", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getCommunitySignals: () => request<any>("/api/feedback/community-signals", {
      method: "GET",
    }),
  },

  // Multi-Agent System
  agents: {
    ask: (data: any) => request<any>("/api/agents/ask", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    voiceCommand: (data: any) => request<any>("/api/agents/voice-command", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getStatus: () => request<any>("/api/agents/status", {
      method: "GET",
    }),
  },

  // RAG Knowledge Base
  rag: {
    query: (data: any) => request<any>("/api/rag/query", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    reindex: () => request<any>("/api/rag/reindex", {
      method: "POST",
    }),
    sources: () => request<any>("/api/rag/sources", {
      method: "GET",
    }),
  },
};
