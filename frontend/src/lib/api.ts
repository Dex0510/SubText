const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string) {
    const data = await this.request<{ user: { user_id: string; email: string }; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ user: { user_id: string; email: string }; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<{ user_id: string; email: string; created_at: string }>('/auth/me');
  }

  async logout() {
    await this.request<{ message: string }>('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async refreshToken() {
    const data = await this.request<{ token: string }>('/auth/refresh', { method: 'POST' });
    this.setToken(data.token);
    return data;
  }

  // User
  async deleteAccount() {
    const data = await this.request<{ message: string }>('/user/account', { method: 'DELETE' });
    this.clearToken();
    return data;
  }

  // Conversations
  async getConversations() {
    return this.request<{
      conversations: Array<{
        conversation_id: string;
        contact_name: string;
        pro_purchased: boolean;
        mri_queries_used: number;
        mri_unlimited: boolean;
        created_at: string;
        last_analyzed_at: string | null;
        deep_analysis_completed: boolean;
        recommendation_count: number;
      }>;
    }>('/conversations');
  }

  async getConversation(conversationId: string) {
    return this.request<{
      conversation: {
        conversation_id: string;
        contact_name: string;
        pro_purchased: boolean;
        mri_queries_used: number;
        mri_unlimited: boolean;
        created_at: string;
        last_analyzed_at: string | null;
      };
      cases: Array<{
        case_id: string;
        case_type: string;
        status: string;
        created_at: string;
        completed_at: string | null;
      }>;
      analysis_report: unknown;
      deep_analysis_report: unknown;
      mri_queries: Array<{
        query_id: string;
        question: string;
        answer: string | null;
        status: string;
        created_at: string;
      }>;
      chat_recommendations: Array<{
        recommendation_id: string;
        recommendation: string | null;
        tokens_used: number;
        cost_cents: number;
        status: string;
        created_at: string;
      }>;
      encrypted_identity_map: unknown;
    }>(`/conversations/${conversationId}`);
  }

  async updateConversation(conversationId: string, data: { contact_name?: string }) {
    return this.request<{ conversation: unknown }>(
      `/conversations/${conversationId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
  }

  async deleteConversation(conversationId: string) {
    return this.request<{ message: string }>(`/conversations/${conversationId}`, { method: 'DELETE' });
  }

  // Upload
  async uploadAnalysis(
    files: File[],
    encryptedIdentityMap?: string,
    platform?: string,
    contactName?: string,
    conversationId?: string
  ) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (encryptedIdentityMap) {
      formData.append('encrypted_identity_map', encryptedIdentityMap);
    }
    if (platform) {
      formData.append('platform', platform);
    }
    if (contactName) {
      formData.append('contact_name', contactName);
    }
    if (conversationId) {
      formData.append('conversation_id', conversationId);
    }
    return this.request<{
      conversation_id: string;
      case_id: string;
      job_id: string;
      status: string;
      estimated_time_minutes: number;
    }>(
      '/upload/analysis',
      { method: 'POST', body: formData }
    );
  }

  async uploadChatRecommendScreenshot(file: File, conversationId: string) {
    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('conversation_id', conversationId);
    return this.request<{
      conversation_id: string;
      screenshot_key: string;
      message: string;
    }>(
      '/upload/chat-recommend',
      { method: 'POST', body: formData }
    );
  }

  async getStatus(caseId: string) {
    return this.request<{
      case_id: string;
      conversation_id: string | null;
      status: string;
      case_type: string;
      progress: number;
      stage: string;
      report_url: string | null;
    }>(`/upload/status/${caseId}`);
  }

  // Report (legacy)
  async getReport(caseId: string) {
    return this.request<{
      case_id: string;
      case_type: string;
      report_data: unknown;
      encrypted_identity_map: unknown;
    }>(`/report/${caseId}`);
  }

  // Pro Features
  async runDeepAnalysis(conversationId: string) {
    return this.request<{
      case_id: string;
      job_id: string;
      status: string;
      estimated_time_minutes: number;
    }>(
      `/conversations/${conversationId}/deep-analysis`,
      { method: 'POST' }
    );
  }

  async submitMriQuery(conversationId: string, question: string) {
    return this.request<{
      query_id: string;
      job_id: string;
      status: string;
      mri_queries_used: number;
      free_remaining: number | null;
      is_unlimited: boolean;
    }>(
      `/conversations/${conversationId}/mri-query`,
      { method: 'POST', body: JSON.stringify({ question }) }
    );
  }

  async getMriQueryResult(conversationId: string, queryId: string) {
    return this.request<{
      query_id: string;
      question: string;
      answer: string | null;
      status: string;
      created_at: string;
    }>(`/conversations/${conversationId}/mri-query/${queryId}`);
  }

  async submitChatRecommendation(conversationId: string, screenshotKey: string) {
    return this.request<{
      recommendation_id: string;
      job_id: string;
      status: string;
      estimated_cost_cents: number;
    }>(
      `/conversations/${conversationId}/chat-recommend`,
      { method: 'POST', body: JSON.stringify({ screenshot_key: screenshotKey }) }
    );
  }

  async getChatRecommendationResult(conversationId: string, recommendationId: string) {
    return this.request<{
      recommendation_id: string;
      recommendation: string | null;
      tokens_used: number;
      cost_cents: number;
      status: string;
      created_at: string;
    }>(`/conversations/${conversationId}/chat-recommend/${recommendationId}`);
  }

  // Payment
  async createPaymentIntent(productType: 'pro_features' | 'mri_unlimited', conversationId: string) {
    return this.request<{
      client_secret: string;
      payment_intent_id: string;
      amount: number;
      product_type: string;
      conversation_id: string;
    }>(
      '/payment/create-intent',
      { method: 'POST', body: JSON.stringify({ product_type: productType, conversation_id: conversationId }) }
    );
  }
}

export const api = new ApiClient();
