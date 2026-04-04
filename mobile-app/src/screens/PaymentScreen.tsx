import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SelectInput } from "../components/SelectInput";
import { StatusMessageCard } from "../components/StatusMessageCard";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { createPolicyPurchase, getApiErrorMessage, saveOnboarding } from "../services/backendApi";
import { useAppStore } from "../store/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Payment">;

const METHODS = ["GPay", "Paytm", "BharatPe", "PhonePe", "Amazon Pay"];

export function PaymentScreen({ navigation, route }: Props) {
  const { onboarding, updateOnboarding, authToken } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = useMemo(
    () => onboarding.quotePlans.find((item) => item.name === route.params.planName),
    [onboarding.quotePlans, route.params.planName]
  );

  const onPay = async () => {
    if (!authToken || !plan || !onboarding.quoteId) {
      setError("Missing quote or session details. Please restart from onboarding.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const policy = await createPolicyPurchase(authToken, {
        quote_id: onboarding.quoteId,
        selected_plan_name: plan.name,
        payment_method: paymentMethod,
        upi_id: upiId.trim(),
      });
      const purchasedPolicy = {
        policyId: policy.policy_id,
        planName: policy.plan,
        premium: policy.premium,
        coverage: policy.coverage,
        payoutDate: policy.payout_date,
        status: policy.status,
      };
      updateOnboarding({
        policyPurchased: true,
        purchasedPolicy,
      });
      await saveOnboarding(authToken, {
        ...onboarding,
        policyPurchased: true,
        purchasedPolicy,
      });
      Alert.alert("Payment success", "Policy purchased successfully.");
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    } catch (err) {
      setError(getApiErrorMessage(err, "Payment failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Payment unavailable</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Mock Payment</Text>
      <Text style={styles.subtitle}>Pay for {plan.name} policy</Text>
      <Text style={styles.amount}>INR {plan.premium.toFixed(2)}</Text>
      {!!error && <StatusMessageCard title="Payment issue" message={error} />}

      <SelectInput
        label="Payment app"
        placeholder="Choose payment option"
        value={paymentMethod}
        options={METHODS}
        onSelect={(value) => {
          setPaymentMethod(value);
          if (error) {
            setError("");
          }
        }}
      />
      <FormInput
        label="UPI ID"
        value={upiId}
        placeholder="example@upi"
        autoCapitalize="none"
        onChangeText={(value) => {
          setUpiId(value);
          if (error) {
            setError("");
          }
        }}
      />

      <PrimaryButton
        label={loading ? "Processing..." : "Pay Now"}
        disabled={!paymentMethod || !upiId.trim() || loading || onboarding.policyPurchased}
        onPress={onPay}
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
    marginBottom: spacing.md,
  },
  amount: {
    color: colors.primaryDark,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
});
