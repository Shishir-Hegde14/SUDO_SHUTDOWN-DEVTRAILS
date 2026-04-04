import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatusMessageCard({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E4B1B1",
    backgroundColor: "#FDF0F0",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  message: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#E4B1B1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
