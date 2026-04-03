import { PropsWithChildren } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, radius, shadows, spacing } from "../constants/theme";

type Props = PropsWithChildren<{
  scroll?: boolean;
  showHeader?: boolean;
  onboardingStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}>;

export function ScreenContainer({ children, scroll = true, showHeader = true, onboardingStep }: Props) {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const header = showHeader ? (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          if (canGoBack) {
            navigation.goBack();
          }
        }}
        style={[styles.backButton, !canGoBack && styles.backButtonHidden]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.brandWrap}>
        <View style={styles.logoChip}>
          <Image source={require("../../assets/LastMile.png")} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.brandText}>LastMile</Text>
      </View>

      <View style={styles.backButton} />
    </View>
  ) : null;

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={gradients.background} style={styles.gradient}>
          <View style={styles.bgBlobTop} />
          <View style={styles.bgBlobMid} />
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {header}
            <View style={styles.contentInner}>{children}</View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={gradients.background} style={styles.gradient}>
        <View style={styles.bgBlobTop} />
        <View style={styles.bgBlobMid} />
        <View style={styles.content}>
          {header}
          <View style={styles.contentInner}>{children}</View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  bgBlobTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: radius.pill,
    backgroundColor: "rgba(198,40,40,0.08)",
    top: -120,
    right: -90,
  },
  bgBlobMid: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radius.pill,
    backgroundColor: "rgba(198,40,40,0.06)",
    top: "42%",
    left: -130,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contentInner: {
    flexGrow: 1,
    paddingTop: spacing.sm,
  },
  header: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  backButtonHidden: {
    opacity: 0,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logoChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  brandText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
});
