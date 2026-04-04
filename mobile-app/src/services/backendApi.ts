import * as Network from "expo-network";
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

export type ClaimResponse = {
  claim_id: string;
  policy_id: string;
  week_start: string;
  trigger_date: string;
  trigger_reason: string;
  amount: number;
  status: string;
  payout_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type PayoutResponse = {
  payout_id: string;
  claim_id: string;
  policy_id: string;
  amount: number;
  status: string;
  paid_at: string;
  created_at: string;
};

export type ApiErrorType = "network_offline" | "server_unreachable" | "timeout" | "bad_response";

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;

  constructor(type: ApiErrorType, message: string, status?: number) {
    super(message);
    this.type = type;
    this.status = status;
  }
}

type ApiRequestOptions = RequestInit & { timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 15000;
const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseError(res: Response): Promise<never> {
  const fallback = `Server responded with ${res.status}`;
  let message = fallback;
  try {
    const data = (await res.json()) as { detail?: string; error?: string; message?: string };
    message = data.detail || data.error || data.message || fallback;
  } catch {
    message = fallback;
  }
  if (res.status === 401 && message === fallback) {
    message = "Session expired. Please sign in again.";
  }
  if (res.status >= 500 && message === fallback) {
    message = "Server is temporarily unavailable. Please try again shortly.";
  }
  throw new ApiError("bad_response", message, res.status);
}

async function hasInternetConnection(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) {
      return false;
    }
    if (state.isInternetReachable === false) {
      return false;
    }
  } catch {
    // If network state cannot be read, continue and let request/fetch decide.
  }
  return true;
}

function isAbortError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError";
}

async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const connected = await hasInternetConnection();
  if (!connected) {
    throw new ApiError("network_offline", "No internet connection. Connect to Wi-Fi or mobile data and try again.");
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      await parseError(res);
    }
    return res;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (isAbortError(err)) {
      throw new ApiError("timeout", "Request timed out. Please try again.");
    }
    throw new ApiError(
      "server_unreachable",
      "Unable to reach server right now. Please check your connection and try again."
    );
  } finally {
    clearTimeout(timer);
  }
}

async function apiJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("bad_response", "Received an unexpected response from server.", res.status);
  }
}

function authHeaders(token?: string): Record<string, string> {
  if (!token) {
    return JSON_HEADERS;
  }
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong while talking to the server. Please try again."
): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export async function authSignUp(email: string, name?: string): Promise<AuthResponse> {
  return await apiJson<AuthResponse>("/auth/signup", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, name }),
  });
}

export async function authSignIn(email: string): Promise<AuthResponse> {
  return await apiJson<AuthResponse>("/auth/signin", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
}

export async function authSession(token: string): Promise<AuthUser> {
  const data = await apiJson<{ user: AuthUser }>("/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user;
}

export async function requestQuote(payload: QuoteRequest, token?: string): Promise<QuoteResponse> {
  return await apiJson<QuoteResponse>("/quote", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    timeoutMs: 20000,
  });
}

export async function createPolicyPurchase(
  token: string,
  payload: { quote_id: string; selected_plan_name: string; payment_method: string; upi_id: string }
): Promise<PolicyResponse> {
  return await apiJson<PolicyResponse>("/policy/create", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function listMyPolicies(token: string): Promise<PolicyResponse[]> {
  const data = await apiJson<{ policies: PolicyResponse[] }>("/policies/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.policies || [];
}

export async function listMyClaims(token: string): Promise<ClaimResponse[]> {
  const data = await apiJson<{ claims: ClaimResponse[] }>("/claims/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.claims || [];
}

export async function listMyPayouts(token: string): Promise<PayoutResponse[]> {
  const data = await apiJson<{ payouts: PayoutResponse[] }>("/payouts/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.payouts || [];
}

export async function runDailyClaimMonitor(token: string, date?: string): Promise<void> {
  await apiFetch("/claims/run-daily", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(date ? { date } : {}),
  });
}

export async function saveOnboarding(token: string, data: unknown): Promise<void> {
  await apiFetch("/onboarding/save", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getOnboarding(token: string): Promise<unknown | null> {
  const data = await apiJson<{ data?: unknown | null }>("/onboarding/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data ?? null;
}
