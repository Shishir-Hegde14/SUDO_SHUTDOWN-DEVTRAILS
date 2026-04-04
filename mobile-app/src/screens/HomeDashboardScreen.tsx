import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";

export function HomeDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { onboarding } = useAppStore();
  const plans = onboarding.quotePlans
    .filter((plan) => ["basic", "super"].includes(plan.name.toLowerCase()))
    .sort((a, b) => (a.name.toLowerCase() === "basic" ? -1 : b.name.toLowerCase() === "basic" ? 1 : 0));

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcome}>Welcome, {onboarding.fullName || "Rider"}</Text>
          <Text style={styles.caption}>Choose your weekly protection plan</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Payouts")}>
            <Ionicons name="wallet-outline" size={18} color={colors.primaryDark} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-outline" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      <LinearGradient colors={["#D94C4C", "#AE2323"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEyebrow}>Weekly Protection</Text>
        <Text style={styles.heroTitle}>
          {onboarding.policyPurchased && onboarding.purchasedPolicy
            ? `${onboarding.purchasedPolicy.planName} Policy Active`
            : "Choose a policy for this week"}
        </Text>
        <Text style={styles.heroMeta}>
          {onboarding.policyPurchased && onboarding.purchasedPolicy
            ? `Active policy ID: ${onboarding.purchasedPolicy.policyId.slice(0, 8)}...`
            : "Buy weekly protection plans based on current quote cycle."}
        </Text>
      </LinearGradient>

      {plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptyBody}>Finish onboarding to fetch your Basic and Super plan premiums.</Text>
        </View>
      ) : (
        plans.map((plan) => (
          <View key={plan.name} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name} Policy</Text>
              <View style={[styles.badge, plan.name.toLowerCase() === "super" ? styles.badgeSuper : styles.badgeBasic]}>
                <Text style={styles.badgeText}>{plan.name.toLowerCase() === "super" ? "Advanced" : "Core"}</Text>
              </View>
            </View>
            <Text style={styles.planPremiumLabel}>Weekly Premium</Text>
            <Text style={styles.planPremium}>INR {plan.premium.toFixed(2)}</Text>
            {plan.benefits?.slice(0, 2).map((benefit) => (
              <View key={`${plan.name}-${benefit}`} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
            <View style={styles.planActions}>
              <PrimaryButton
                label="View Policy"
                variant="secondary"
                onPress={() => navigation.navigate("PolicyDetails", { planName: plan.name })}
              />
              <PrimaryButton
                label={onboarding.policyPurchased ? "Purchased" : "Purchase"}
                disabled={onboarding.policyPurchased}
                onPress={() => navigation.navigate("Payment", { planName: plan.name })}
              />
            </View>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcome: {
    color: colors.text,
    ...typography.heading,
    fontSize: 24,
    marginBottom: 2,
  },
  caption: {
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  hero: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.strong,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  emptyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.soft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyBody: {
    color: colors.muted,
    lineHeight: 20,
  },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeBasic: {
    backgroundColor: "#FDEDEE",
  },
  badgeSuper: {
    backgroundColor: "#FFE8D2",
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  planPremiumLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planPremium: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    flex: 1,
    color: colors.text,
    fontWeight: "600",
  },
  planActions: {
    gap: spacing.sm,
  },
});
