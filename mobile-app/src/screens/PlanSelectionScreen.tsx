import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";
import * as Location from "expo-location";

type Props = NativeStackScreenProps<RootStackParamList, "PlanSelection">;

export function PlanSelectionScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [detectingArea, setDetectingArea] = useState(false);
  const [workAreaCenter, setWorkAreaCenter] = useState(onboarding.workAreaCenter);
  const [workAreaRegion, setWorkAreaRegion] = useState(onboarding.workAreaRegion);
  const [workAreaLatitude, setWorkAreaLatitude] = useState<number | null>(onboarding.workAreaLatitude);
  const [workAreaLongitude, setWorkAreaLongitude] = useState<number | null>(onboarding.workAreaLongitude);
  const [workAreaState, setWorkAreaState] = useState(onboarding.workAreaState);

  const detectWorkArea = async () => {
    try {
      setDetectingArea(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow location permission so we can set your work area.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = reverse[0];

      const locality = first?.district || first?.subregion || first?.city || "Detected locality";
      const city = first?.city || first?.subregion || "";
      const state = first?.region || "";
      const center = city ? `${locality}, ${city}` : locality;
      const region = state
        ? `Approx 3km radius around ${locality}, ${state}`
        : `Approx 3km radius around ${locality}`;

      setWorkAreaCenter(center);
      setWorkAreaRegion(region);
      setWorkAreaLatitude(latitude);
      setWorkAreaLongitude(longitude);
      setWorkAreaState(state);
    } catch {
      Alert.alert("Location error", "Could not get work area location. Please try again.");
    } finally {
      setDetectingArea(false);
    }
  };

  return (
    <ScreenContainer onboardingStep={6}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 6</Text>
        <Text style={styles.subtitle}>Area of working</Text>
        <Text style={styles.info}>We use your current location to estimate your regular delivery region.</Text>

        <PrimaryButton label="Detect Area from GPS" variant="secondary" onPress={detectWorkArea} />
        {detectingArea && <ActivityIndicator style={styles.loader} color={colors.primary} />}

        {!!workAreaCenter && (
          <InfoCard title="Detected work locality">
            <Text style={styles.value}>{workAreaCenter}</Text>
          </InfoCard>
        )}
        {!!workAreaRegion && (
          <InfoCard title="Coverage radius">
            <Text style={styles.value}>{workAreaRegion}</Text>
          </InfoCard>
        )}
      </View>

      <PrimaryButton
        label="Next"
        disabled={!workAreaCenter || !workAreaRegion || workAreaLatitude === null || workAreaLongitude === null}
        onPress={() => {
          updateOnboarding({
            workAreaCenter,
            workAreaRegion,
            workAreaLatitude,
            workAreaLongitude,
            workAreaState,
            city: onboarding.city || (workAreaCenter.includes(",") ? workAreaCenter.split(",").pop()?.trim() || "" : ""),
          });
          navigation.navigate("PolicyConfirmation");
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
    marginBottom: spacing.sm,
  },
  info: {
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  loader: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  value: {
    color: colors.text,
    lineHeight: 22,
  },
});
