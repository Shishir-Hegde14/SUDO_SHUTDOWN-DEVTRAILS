import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../components/ScreenContainer";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusMessageCard } from "../components/StatusMessageCard";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { authSignIn, getApiErrorMessage, getOnboarding, listMyPolicies, PolicyResponse } from "../services/backendApi";
import { useAppStore } from "../store/AppContext";
import { initialOnboardingData, OnboardingData } from "../types/onboarding";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

type Mode = "signup" | "signin";

export function AuthScreen({ navigation }: Props) {
  const { setAuthSession, setOnboarding } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isValidGmail = useMemo(
    () => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(cleanEmail),
    [cleanEmail]
  );

  const onSubmit = async (nextMode: Mode) => {
    if (nextMode === "signup") {
      navigation.replace("Login");
      return;
    }

    if (!isValidGmail) {
      setError("Enter a valid Gmail address (example@gmail.com).");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const auth = await authSignIn(cleanEmail);
      await setAuthSession(auth.token, auth.user);

      const existingOnboarding = await getOnboarding(auth.token);
      let policies: PolicyResponse[] = [];
      try {
        policies = await listMyPolicies(auth.token);
      } catch {
        policies = [];
      }
      const base = existingOnboarding ? (existingOnboarding as OnboardingData) : initialOnboardingData;
      const active = policies.find((item) => item.status === "active");
      if (active) {
        setOnboarding({
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
        });
      } else {
        setOnboarding({ ...base, policyPurchased: false, purchasedPolicy: null });
      }
      navigation.replace("MainApp");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to authenticate right now."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Access LastMile</Text>
        <Text style={styles.subtitle}>Sign up with onboarding, or sign in with your Gmail.</Text>
        {!!error && <StatusMessageCard title="Sign in issue" message={error} />}

        <PrimaryButton
          label="Sign Up"
          onPress={() => onSubmit("signup")}
          disabled={busy}
        />
        <View style={styles.signinBlock}>
          <Text style={styles.signinTitle}>Sign In</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) {
                setError("");
              }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@gmail.com"
            placeholderTextColor={colors.muted}
          />
        </View>
        <PrimaryButton
          label="Sign In"
          variant="secondary"
          onPress={() => onSubmit("signin")}
          disabled={!isValidGmail || busy}
        />
        {busy && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        <Text style={styles.helper}>Existing users can sign in directly with Gmail.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  signinBlock: {
    marginTop: spacing.md,
  },
  signinTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  loader: {
    marginTop: spacing.md,
  },
  helper: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 13,
  },
});
