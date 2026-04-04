import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { ApiError, authSession, AuthUser, getOnboarding, listMyPolicies, PolicyResponse } from "../services/backendApi";
import { initialOnboardingData, OnboardingData, PlanType } from "../types/onboarding";

const TOKEN_KEY = "lm_auth_token";
const USER_KEY = "lm_auth_user";

type AppContextValue = {
  onboarding: OnboardingData;
  updateOnboarding: (patch: Partial<OnboardingData>) => void;
  setPlan: (plan: PlanType) => void;
  setOnboarding: (value: OnboardingData) => void;
  authToken: string | null;
  authUser: AuthUser | null;
  isRestoringSession: boolean;
  setAuthSession: (token: string, user: AuthUser) => Promise<void>;
  clearAuthSession: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function mergePolicyState(base: OnboardingData, policies: PolicyResponse[] | null | undefined): OnboardingData {
  if (!policies || policies.length === 0) {
    return {
      ...base,
      policyPurchased: false,
      purchasedPolicy: null,
    };
  }
  const active = policies.find((item) => item.status === "active");
  if (!active) {
    return {
      ...base,
      policyPurchased: false,
      purchasedPolicy: null,
    };
  }
  return {
    ...base,
    policyPurchased: true,
    purchasedPolicy: {
      policyId: active.policy_id,
      planName: active.plan || active.plan_name || "Policy",
      premium: active.premium,
      coverage: active.coverage,
      payoutDate: active.payout_date,
      status: active.status,
    },
  };
}

export function AppProvider({ children }: PropsWithChildren) {
  const [onboarding, setOnboardingState] = useState<OnboardingData>(initialOnboardingData);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userRaw = await SecureStore.getItemAsync(USER_KEY);
        if (token && userRaw) {
          const parsedUser = JSON.parse(userRaw) as AuthUser;
          setAuthToken(token);
          setAuthUser(parsedUser);

          // Validate session with backend and rehydrate onboarding snapshot.
          try {
            const user = await authSession(token);
            setAuthUser(user.email ? user : parsedUser);
          } catch (err) {
            if (!(err instanceof ApiError) || err.type === "bad_response") {
              throw err;
            }
          }

          let savedState = initialOnboardingData;
          try {
            const saved = await getOnboarding(token);
            savedState = saved ? (saved as OnboardingData) : initialOnboardingData;
          } catch (err) {
            if (!(err instanceof ApiError) || err.type === "bad_response") {
              throw err;
            }
          }

          let policies: PolicyResponse[] = [];
          try {
            policies = await listMyPolicies(token);
          } catch {
            policies = [];
          }
          setOnboardingState(mergePolicyState(savedState, policies));
        }
      } catch {
        setAuthToken(null);
        setAuthUser(null);
      } finally {
        setIsRestoringSession(false);
      }
    };
    void restore();
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      onboarding,
      updateOnboarding: (patch) => setOnboardingState((prev) => ({ ...prev, ...patch })),
      setPlan: (plan) => setOnboardingState((prev) => ({ ...prev, selectedPlan: plan })),
      setOnboarding: (value) => setOnboardingState(value),
      authToken,
      authUser,
      isRestoringSession,
      setAuthSession: async (token, user) => {
        setAuthToken(token);
        setAuthUser(user);
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      },
      clearAuthSession: async () => {
        setAuthToken(null);
        setAuthUser(null);
        setOnboardingState(initialOnboardingData);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      },
    }),
    [onboarding, authToken, authUser, isRestoringSession]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppStore must be used inside AppProvider");
  }
  return ctx;
}
