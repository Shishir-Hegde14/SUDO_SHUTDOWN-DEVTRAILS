import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, shadows } from "../constants/theme";

export function SplashScreen() {
  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <View style={styles.glow} />
      <Image source={require("../../assets/LastMile.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.subtitle}>LastMile</Text>
      <Text style={styles.tagline}>Income protection for delivery riders</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(198, 40, 40, 0.12)",
  },
  logo: {
    width: 160,
    height: 160,
    ...shadows.soft,
  },
  subtitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tagline: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
  },
});
