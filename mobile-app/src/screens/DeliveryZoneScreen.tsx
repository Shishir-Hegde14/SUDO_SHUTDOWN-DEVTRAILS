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

type Props = NativeStackScreenProps<RootStackParamList, "DeliveryZone">;

export function DeliveryZoneScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [workApp, setWorkApp] = useState(onboarding.workApp);
  const [otherWorkApp, setOtherWorkApp] = useState(onboarding.otherWorkApp);
  const [vehicleType, setVehicleType] = useState(onboarding.vehicleType);
  const shouldShowOther = workApp === "Other";

  return (
    <ScreenContainer onboardingStep={4}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 4</Text>
        <Text style={styles.subtitle}>Work setup</Text>

        <SelectInput
          label="Choose working app"
          placeholder="Select platform"
          value={workApp}
          options={["Swiggy", "Zomato", "Blinkit", "Zepto", "Dunzo", "Other"]}
          onSelect={setWorkApp}
        />
        {shouldShowOther && (
          <FormInput
            label="Other app name"
            value={otherWorkApp}
            placeholder="Enter app name"
            onChangeText={setOtherWorkApp}
          />
        )}
        <SelectInput
          label="Vehicle type"
          placeholder="Select your vehicle"
          value={vehicleType}
          options={["Bike", "Scooter", "Car", "Cycle", "Truck"]}
          onSelect={setVehicleType}
        />
      </View>

      <PrimaryButton
        label="Next"
        disabled={!workApp || !vehicleType || (shouldShowOther && !otherWorkApp.trim())}
        onPress={() => {
          updateOnboarding({
            workApp,
            otherWorkApp: shouldShowOther ? otherWorkApp.trim() : "",
            vehicleType,
          });
          navigation.navigate("Quote");
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
