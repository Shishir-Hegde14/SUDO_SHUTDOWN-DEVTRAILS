import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";
import * as Location from "expo-location";

type Props = NativeStackScreenProps<RootStackParamList, "WorkProfile">;

export function WorkProfileScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [homeAddress, setHomeAddress] = useState(onboarding.homeAddress);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const fillWithGps = async () => {
    try {
      setLoadingLocation(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow location access to auto-fill address.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = reverse[0];
      const builtAddress = first
        ? `${first.name || ""} ${first.street || ""}, ${first.city || first.subregion || ""}, ${first.region || ""}`.replace(/\s+,/g, ",").trim()
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setHomeAddress(builtAddress);
      updateOnboarding({
        homeLatitude: latitude,
        homeLongitude: longitude,
      });
    } catch {
      Alert.alert("Location error", "Could not fetch current location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <ScreenContainer onboardingStep={3}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 3</Text>
        <Text style={styles.subtitle}>Address and location</Text>
        <Text style={styles.info}>Allow location permission to auto-fill your current address.</Text>

        <FormInput
          label="Address"
          value={homeAddress}
          placeholder="Enter your address"
          onChangeText={setHomeAddress}
        />

        <PrimaryButton label="Use Current Location" variant="secondary" onPress={fillWithGps} />
        {loadingLocation && <ActivityIndicator style={styles.loader} color={colors.primary} />}
      </View>

      <PrimaryButton
        label="Next"
        disabled={!homeAddress.trim()}
        onPress={() => {
          updateOnboarding({ homeAddress: homeAddress.trim() });
          navigation.navigate("DeliveryZone");
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
    marginBottom: 8,
  },
  info: {
    color: colors.muted,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
