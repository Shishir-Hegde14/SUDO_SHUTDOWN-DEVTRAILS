import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "PolicyDetails">;

export function PolicyDetailsScreen({ navigation, route }: Props) {
  const { onboarding } = useAppStore();
  const plan = onboarding.quotePlans.find((item) => item.name === route.params.planName);
  const payoutDate = onboarding.quoteWeekStart
    ? new Date(new Date(onboarding.quoteWeekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "TBD";

  if (!plan) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Policy unavailable</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{plan.name} Policy</Text>
      <Text style={styles.subtitle}>Coverage and payout summary</Text>

      <InfoCard title="Premium">
        <Text style={styles.amount}>INR {plan.premium.toFixed(2)} / week</Text>
      </InfoCard>

      {plan.name.toLowerCase() === "super" && (
        <InfoCard title="Super Add-on" subtitle="Enhanced protection">
          <Text style={styles.meta}>
            Includes fuel-surge liability cushion
            {plan.fuel_liability_cover ? ` (up to INR ${plan.fuel_liability_cover.toFixed(2)})` : ""}.
          </Text>
        </InfoCard>
      )}

      <InfoCard title="Estimated Payout" subtitle="If disruption claim is approved">
        <Text style={styles.payout}>INR {plan.coverage.toFixed(2)}</Text>
        <Text style={styles.meta}>Expected payout date: {payoutDate}</Text>
      </InfoCard>

      <InfoCard title="Protection Highlights">
        {(plan.benefits?.length ? plan.benefits : onboarding.protectedFactors).map((item) => (
          <Text key={item} style={styles.row}>
            - {item}
          </Text>
        ))}
      </InfoCard>

      <PrimaryButton
        label={onboarding.policyPurchased ? "Policy Already Purchased" : "Proceed to Payment"}
        disabled={onboarding.policyPurchased}
        onPress={() => navigation.navigate("Payment", { planName: plan.name })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  amount: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  payout: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.success,
    marginBottom: 6,
  },
  meta: {
    color: colors.muted,
  },
  row: {
    color: colors.text,
    marginBottom: 6,
  },
});
