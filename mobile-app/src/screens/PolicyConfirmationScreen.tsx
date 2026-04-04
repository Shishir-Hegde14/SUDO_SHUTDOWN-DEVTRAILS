import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SelectInput } from "../components/SelectInput";
import { StatusMessageCard } from "../components/StatusMessageCard";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";
import { ApiError, authSignUp, getApiErrorMessage, requestQuote, saveOnboarding } from "../services/backendApi";

type Props = NativeStackScreenProps<RootStackParamList, "PolicyConfirmation">;

export function PolicyConfirmationScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding, authToken, setAuthSession } = useAppStore();
  const [bankName, setBankName] = useState(onboarding.bankName);
  const [bankAccountNumber, setBankAccountNumber] = useState(onboarding.bankAccountNumber);
  const [bankAddress, setBankAddress] = useState(onboarding.bankAddress);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const finishOnboarding = async () => {
    try {
      setLoading(true);
      setConnectionError("");

      updateOnboarding({
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAddress: bankAddress.trim(),
      });

      let sessionToken = authToken;
      if (!sessionToken) {
        const email = onboarding.email.trim().toLowerCase();
        if (!email) {
          setConnectionError("Email is missing. Please go back to Step 2 and enter Gmail.");
          return;
        }
        const signup = await authSignUp(email, onboarding.fullName.trim() || undefined);
        await setAuthSession(signup.token, signup.user);
        sessionToken = signup.token;
      }

      const latitude = onboarding.workAreaLatitude ?? onboarding.homeLatitude ?? undefined;
      const longitude = onboarding.workAreaLongitude ?? onboarding.homeLongitude ?? undefined;
      const earnings = Number(onboarding.averageWeeklyEarnings.replace(/,/g, "").trim()) || 5000;
      const date = new Date().toISOString().slice(0, 10);

      const quote = await requestQuote({
        zone_name: onboarding.workAreaRegion || onboarding.homeAddress || "Unknown zone",
        latitude,
        longitude,
        base_earnings: earnings,
        date,
        work_app: onboarding.workApp,
        vehicle_type: onboarding.vehicleType,
        working_days_count: onboarding.workingDays.length,
        work_start_time: onboarding.workStartTime,
        work_end_time: onboarding.workEndTime,
        city: onboarding.city,
        state: onboarding.workAreaState,
      }, sessionToken || undefined);

      const protectedFactors = ["Income interruption coverage"];
      if (quote.fuel_price) {
        protectedFactors.push(`Fuel-linked risk considered (INR ${quote.fuel_price.toFixed(2)}/L)`);
      }
      if (quote.holiday) {
        protectedFactors.push(`Holiday surge (${quote.holiday})`);
      }

      updateOnboarding({
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAddress: bankAddress.trim(),
        quoteId: quote.quote_id,
        quoteWeekStart: quote.week_start,
        quotePremium: quote.premium,
        quotePlans: quote.plans,
        quoteDate: quote.date,
        quoteRiskReason: "Risk-calibrated weekly premium based on work profile and market factors.",
        protectedFactors,
        policyPurchased: false,
        purchasedPolicy: null,
        acceptedPolicy: true,
      });
      await saveOnboarding(sessionToken, {
        ...onboarding,
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAddress: bankAddress.trim(),
        quoteId: quote.quote_id,
        quoteWeekStart: quote.week_start,
        quotePremium: quote.premium,
        quotePlans: quote.plans,
        quoteDate: quote.date,
        protectedFactors,
        acceptedPolicy: true,
      });

      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    } catch (err) {
      if (err instanceof ApiError && err.message.toLowerCase().includes("email already in use")) {
        setConnectionError("Email already exists. Use Sign In on the first screen for this Gmail.");
        return;
      }
      setConnectionError(getApiErrorMessage(err, "Unexpected issue while requesting quote."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer onboardingStep={7}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 7</Text>
        <Text style={styles.subtitle}>Bank account details</Text>
        <Text style={styles.info}>On completion, we fetch your quote from the server.</Text>

        <SelectInput
          label="Bank"
          placeholder="Select bank"
          value={bankName}
          options={["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"]}
          onSelect={(value) => {
            setBankName(value);
            if (connectionError) {
              setConnectionError("");
            }
          }}
        />
        <FormInput
          label="Account number"
          value={bankAccountNumber}
          keyboardType="number-pad"
          placeholder="Enter account number"
          onChangeText={(value) => {
            setBankAccountNumber(value);
            if (connectionError) {
              setConnectionError("");
            }
          }}
        />
        <FormInput
          label="Bank address"
          value={bankAddress}
          placeholder="Enter bank branch address"
          onChangeText={(value) => {
            setBankAddress(value);
            if (connectionError) {
              setConnectionError("");
            }
          }}
        />
        {!!connectionError && <StatusMessageCard title="Unable to load quote" message={connectionError} />}
        {loading && <ActivityIndicator style={styles.loader} color={colors.primary} />}
      </View>

      <PrimaryButton
        label="Finish onboarding"
        disabled={!bankName || !bankAccountNumber.trim() || !bankAddress.trim() || loading}
        onPress={finishOnboarding}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.text,
    ...typography.heading,
    marginBottom: 8,
  },
  info: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  loader: {
    marginBottom: spacing.sm,
  },
});
