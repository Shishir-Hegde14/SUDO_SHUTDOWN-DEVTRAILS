import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusMessageCard } from "../components/StatusMessageCard";
import { colors, spacing, typography } from "../constants/theme";
import {
  getApiErrorMessage,
  listMyPayouts,
  listMyPolicies,
  PayoutResponse,
  PolicyResponse,
  runDailyClaimMonitor,
} from "../services/backendApi";
import { useAppStore } from "../store/AppContext";

export function PayoutsScreen() {
  const { authToken } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [error, setError] = useState("");

  const loadPayouts = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      await runDailyClaimMonitor(authToken);
      const [policyData, payoutData] = await Promise.all([listMyPolicies(authToken), listMyPayouts(authToken)]);
      setPolicies(policyData);
      setPayouts(payoutData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load payouts right now."));
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Payouts</Text>
      <Text style={styles.subtitle}>Auto payouts triggered by weekly disruption checks</Text>

      {loading && <ActivityIndicator color={colors.primary} />}
      {!!error && <StatusMessageCard title="Could not load payouts" message={error} actionLabel="Retry" onAction={() => void loadPayouts()} />}
      {!loading && policies.length === 0 && <Text style={styles.empty}>No policies purchased yet.</Text>}
      {!loading && policies.length > 0 && payouts.length === 0 && (
        <InfoCard title="No payout yet" subtitle="No validated trigger reached settlement date">
          <Text style={styles.row}>Your active/expired policies are being monitored daily.</Text>
        </InfoCard>
      )}

      {payouts.map((payout) => (
        <InfoCard key={payout.payout_id} title={`Payout ${payout.payout_id.slice(0, 8)}...`} subtitle={`Status: ${payout.status}`}>
          <Text style={styles.row}>Amount: INR {payout.amount.toFixed(2)}</Text>
          <Text style={styles.row}>Paid on: {payout.paid_at}</Text>
          <Text style={styles.row}>Policy ID: {payout.policy_id.slice(0, 8)}...</Text>
          <Text style={styles.status}>Claim ID: {payout.claim_id.slice(0, 8)}...</Text>
        </InfoCard>
      ))}

      {policies.map((policy) => (
        <InfoCard key={policy.policy_id} title={`${policy.plan || policy.plan_name || "Policy"} Plan`} subtitle={`Policy ID: ${policy.policy_id.slice(0, 8)}...`}>
          <Text style={styles.row}>Premium Paid: INR {policy.premium.toFixed(2)}</Text>
          <Text style={styles.coverage}>Policy Coverage: INR {policy.coverage.toFixed(2)}</Text>
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
  empty: {
    color: colors.muted,
  },
});
