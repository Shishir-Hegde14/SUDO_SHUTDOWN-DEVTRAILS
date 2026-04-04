import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { StatusMessageCard } from "../components/StatusMessageCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { getApiErrorMessage, listMyClaims, ClaimResponse, runDailyClaimMonitor } from "../services/backendApi";
import { useAppStore } from "../store/AppContext";

export function ClaimsScreen() {
  const { authToken } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [error, setError] = useState("");

  const loadClaims = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      // Triggers daily monitor if not already run for today.
      await runDailyClaimMonitor(authToken);
      const data = await listMyClaims(authToken);
      setClaims(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load claims data right now."));
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const summary = useMemo(() => {
    const paid = claims.filter((item) => item.status === "paid").length;
    const validated = claims.filter((item) => item.status === "validated").length;
    return { paid, validated, total: claims.length };
  }, [claims]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Claims</Text>
      <Text style={styles.subtitle}>Auto-generated claims based on trigger checks</Text>

      {loading && <ActivityIndicator color={colors.primary} />}
      {!!error && <StatusMessageCard title="Could not load claims" message={error} actionLabel="Retry" onAction={() => void loadClaims()} />}

      {!loading && claims.length === 0 && (
        <InfoCard title="No claims yet" subtitle="No trigger event has created a claim for your policy week">
          <Text style={styles.text}>Daily monitoring is running. A claim is created automatically if triggers occur.</Text>
        </InfoCard>
      )}

      {!loading && claims.length > 0 && (
        <InfoCard title="Claim Summary">
          <Text style={styles.text}>Total: {summary.total}</Text>
          <Text style={styles.text}>Validated: {summary.validated}</Text>
          <Text style={styles.text}>Paid: {summary.paid}</Text>
        </InfoCard>
      )}

      {claims.map((claim) => (
        <InfoCard key={claim.claim_id} title={`Claim ${claim.claim_id.slice(0, 8)}...`} subtitle={`Status: ${claim.status}`}>
          <View style={styles.rowWrap}>
            <Text style={styles.label}>Trigger</Text>
            <Text style={styles.value}>{claim.trigger_reason}</Text>
          </View>
          <View style={styles.rowWrap}>
            <Text style={styles.label}>Trigger Date</Text>
            <Text style={styles.value}>{claim.trigger_date}</Text>
          </View>
          <View style={styles.rowWrap}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>INR {claim.amount.toFixed(2)}</Text>
          </View>
          {!!claim.payout_id && (
            <View style={styles.rowWrap}>
              <Text style={styles.label}>Payout ID</Text>
              <Text style={styles.value}>{claim.payout_id.slice(0, 8)}...</Text>
            </View>
          )}
        </InfoCard>
      ))}

      <InfoCard title="Claim Lifecycle">
        <Text style={styles.text}>1. Daily monitor checks trigger conditions.</Text>
        <Text style={styles.text}>2. If triggered, claim is marked validated.</Text>
        <Text style={styles.text}>3. At payout date, validated claims are paid automatically.</Text>
      </InfoCard>
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
  text: {
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  rowWrap: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
