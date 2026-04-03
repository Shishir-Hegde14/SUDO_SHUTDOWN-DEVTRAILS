import { API_BASE_URL } from "../constants/config";

export type AuthUser = {
  id: number;
  email: string;
  name?: string;
};

export type QuoteRequest = {
  zone_name?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  base_earnings: number;
  prob?: number;
  severity?: number;
  work_app?: string;
  vehicle_type?: string;
  working_days_count?: number;
  work_start_time?: string;
  work_end_time?: string;
  city?: string;
  state?: string;
};

export type QuotePlan = {
  name: string;
  premium: number;
  coverage: number;
  fuel_liability_cover?: number;
  benefits?: string[];
};

export type QuoteResponse = {
  quote_id: string;
  premium: number;
  weather?: string;
  aqi?: string;
  holiday: string | null;
  fuel_price?: number;
  fuel_price_source?: string;
  risk_multiplier: number;
  total_probability: number;
  date: string;
  plans: QuotePlan[];
  week_start: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type PolicyResponse = {
  policy_id: string;
  plan: string;
  plan_name?: string;
  premium: number;
  coverage: number;
  payout_date: string;
  payment_method?: string;
  status: string;
};

export class ApiError extends Error {
  type: "server_unreachable" | "bad_response";
  status?: number;

  constructor(type: "server_unreachable" | "bad_response", message: string, status?: number) {
    super(message);
    this.type = type;
    this.status = status;
  }
}

async function parseError(res: Response): Promise<never> {
  const fallback = `Server responded with ${res.status}`;
  let message = fallback;
  try {
    const data = (await res.json()) as { detail?: string; error?: string; message?: string };
    message = data.detail || data.error || data.message || fallback;
  } catch {
    message = fallback;
  }
  throw new ApiError("bad_response", message, res.status);
}

export async function authSignUp(email: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) {
    await parseError(res);
  }
  return (await res.json()) as AuthResponse;
}

export async function authSignIn(email: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    await parseError(res);
  }
  return (await res.json()) as AuthResponse;
}

export async function authSession(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await parseError(res);
  }
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

export async function requestQuote(payload: QuoteRequest, token?: string): Promise<QuoteResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/quote`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      await parseError(res);
    }

    return (await res.json()) as QuoteResponse;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      "server_unreachable",
      "Could not connect to server. Please confirm the backend is running."
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function createPolicyPurchase(
  token: string,
  payload: { quote_id: string; selected_plan_name: string; payment_method: string; upi_id: string }
): Promise<PolicyResponse> {
  const res = await fetch(`${API_BASE_URL}/policy/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await parseError(res);
  }
  return (await res.json()) as PolicyResponse;
}

export async function listMyPolicies(token: string): Promise<PolicyResponse[]> {
  const res = await fetch(`${API_BASE_URL}/policies/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await parseError(res);
  }
  const data = (await res.json()) as { policies: PolicyResponse[] };
  return data.policies || [];
}

export async function saveOnboarding(token: string, data: unknown): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/onboarding/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await parseError(res);
  }
}

export async function getOnboarding(token: string): Promise<unknown | null> {
  const res = await fetch(`${API_BASE_URL}/onboarding/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await parseError(res);
  }
  const data = (await res.json()) as { data?: unknown | null };
  return data.data ?? null;
}
