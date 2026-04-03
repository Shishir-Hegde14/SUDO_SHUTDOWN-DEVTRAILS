import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll={false}>
      <View style={styles.body}>
        <Text style={styles.title}>Built for riders, made for confidence.</Text>
        <Text style={styles.subtitle}>
          LastMile keeps your earning journey protected with a clear and simple onboarding flow.
        </Text>
      </View>
      <PrimaryButton label="Get Started" onPress={() => navigation.navigate("Auth")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
});
