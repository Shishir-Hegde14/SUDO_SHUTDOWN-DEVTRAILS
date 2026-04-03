import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "PersonalDetails">;

export function PersonalDetailsScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [email, setEmail] = useState(onboarding.email);
  const [phone, setPhone] = useState(onboarding.phone);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  const cleanedPhone = phone.replace(/\D/g, "");
  const isEmailValid = emailRegex.test(email.trim());
  const isPhoneValid = cleanedPhone.length >= 10;

  return (
    <ScreenContainer onboardingStep={2}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 2</Text>
        <Text style={styles.subtitle}>Contact details</Text>

        <FormInput
          label="Gmail"
          value={email}
          placeholder="Enter your Gmail"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
        <FormInput
          label="Phone number"
          value={phone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          maxLength={15}
          onChangeText={setPhone}
        />
        {!isEmailValid && email.trim().length > 0 && (
          <Text style={styles.error}>Please enter a valid Gmail address.</Text>
        )}
      </View>

      <PrimaryButton
        label="Next"
        disabled={!isEmailValid || !isPhoneValid}
        onPress={() => {
          updateOnboarding({ email: email.trim(), phone: cleanedPhone });
          navigation.navigate("WorkProfile");
        }}
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
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.primary,
    marginTop: -8,
    marginBottom: 10,
    fontSize: 13,
  },
});
