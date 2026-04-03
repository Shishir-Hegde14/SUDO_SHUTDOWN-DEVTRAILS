import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authSession, AuthUser, getOnboarding, listMyPolicies, PolicyResponse } from "../services/backendApi";
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
  const latest = policies[0];
  return {
    ...base,
    policyPurchased: true,
    purchasedPolicy: {
      policyId: latest.policy_id,
      planName: latest.plan || latest.plan_name || "Policy",
      premium: latest.premium,
      coverage: latest.coverage,
      payoutDate: latest.payout_date,
      status: latest.status,
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
          // Validate session with backend and rehydrate onboarding snapshot.
          const user = await authSession(token);
          setAuthToken(token);
          setAuthUser(user.email ? user : parsedUser);
          const saved = await getOnboarding(token);
          let policies: PolicyResponse[] = [];
          try {
            policies = await listMyPolicies(token);
          } catch {
            policies = [];
          }
          const savedState = saved ? (saved as OnboardingData) : initialOnboardingData;
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
