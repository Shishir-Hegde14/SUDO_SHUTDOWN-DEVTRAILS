import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { listMyPolicies, PolicyResponse } from "../services/backendApi";
import { useAppStore } from "../store/AppContext";

export function PayoutsScreen() {
  const { authToken } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await listMyPolicies(authToken);
        setPolicies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load purchases.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [authToken]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Purchases</Text>
      <Text style={styles.subtitle}>Track purchased policies and expected payouts</Text>

      {loading && <ActivityIndicator color={colors.primary} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && policies.length === 0 && <Text style={styles.empty}>No policies purchased yet.</Text>}

      {policies.map((policy) => (
        <InfoCard key={policy.policy_id} title={`${policy.plan || policy.plan_name || "Policy"} Plan`} subtitle={`Policy ID: ${policy.policy_id.slice(0, 8)}...`}>
          <Text style={styles.row}>Premium Paid: INR {policy.premium.toFixed(2)}</Text>
          <Text style={styles.coverage}>Payout Coverage: INR {policy.coverage.toFixed(2)}</Text>
          <Text style={styles.row}>Payout Date: {policy.payout_date}</Text>
          <Text style={styles.row}>Payment Mode: {policy.payment_method}</Text>
          <Text style={styles.status}>Status: {policy.status}</Text>
        </InfoCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.heading,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  row: {
    color: colors.text,
    marginBottom: 6,
  },
  coverage: {
    color: colors.success,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  status: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  error: {
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.muted,
  },
});
