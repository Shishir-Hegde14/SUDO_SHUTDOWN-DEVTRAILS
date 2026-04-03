import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SelectInput } from "../components/SelectInput";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [fullName, setFullName] = useState(onboarding.fullName);
  const [gender, setGender] = useState(onboarding.gender);

  return (
    <ScreenContainer onboardingStep={1}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 1</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <FormInput label="Name" placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />
        <SelectInput
          label="Gender"
          placeholder="Select gender"
          value={gender}
          options={["Male", "Female", "Other", "Prefer not to say"]}
          onSelect={setGender}
        />
      </View>

      <PrimaryButton
        label="Continue"
        disabled={!fullName.trim() || !gender}
        onPress={() => {
          updateOnboarding({ fullName: fullName.trim(), gender });
          navigation.navigate("PersonalDetails");
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
});
