import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SelectInput } from "../components/SelectInput";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Quote">;
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];
const meridiemOptions = ["AM", "PM"];

function parseTimeParts(value: string, fallbackHour = "09", fallbackMinute = "00", fallbackMeridiem = "AM") {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    return { hour: fallbackHour, minute: fallbackMinute, meridiem: fallbackMeridiem };
  }
  const [, hour, minute, meridiem] = match;
  return { hour: hour.padStart(2, "0"), minute, meridiem: meridiem.toUpperCase() };
}

function to24HourMinutes(hour: string, minute: string, meridiem: string) {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (meridiem === "AM") {
    h = h === 12 ? 0 : h;
  } else {
    h = h === 12 ? 12 : h + 12;
  }
  return h * 60 + m;
}

function formatDisplayTime(hour: string, minute: string, meridiem: string) {
  return `${hour}:${minute} ${meridiem}`;
}

export function QuoteScreen({ navigation }: Props) {
  const { onboarding, updateOnboarding } = useAppStore();
  const [workingDays, setWorkingDays] = useState<string[]>(onboarding.workingDays);
  const startDefaults = parseTimeParts(onboarding.workStartTime || "09:00 AM", "09", "00", "AM");
  const endDefaults = parseTimeParts(onboarding.workEndTime || "06:00 PM", "06", "00", "PM");
  const [startHour, setStartHour] = useState(startDefaults.hour);
  const [startMinute, setStartMinute] = useState(startDefaults.minute);
  const [startMeridiem, setStartMeridiem] = useState(startDefaults.meridiem);
  const [endHour, setEndHour] = useState(endDefaults.hour);
  const [endMinute, setEndMinute] = useState(endDefaults.minute);
  const [endMeridiem, setEndMeridiem] = useState(endDefaults.meridiem);
  const [averageWeeklyEarnings, setAverageWeeklyEarnings] = useState(onboarding.averageWeeklyEarnings);

  const toggleDay = (day: string) => {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  };

  const startInMinutes = to24HourMinutes(startHour, startMinute, startMeridiem);
  const endInMinutes = to24HourMinutes(endHour, endMinute, endMeridiem);
  const isTimeRangeValid = startInMinutes < endInMinutes;
  const earningsNumber = parseFloat(averageWeeklyEarnings.replace(/,/g, "").trim());
  const isEarningsValid = Number.isFinite(earningsNumber) && earningsNumber > 0;

  return (
    <ScreenContainer onboardingStep={5}>
      <View style={styles.content}>
        <Text style={styles.title}>Step 5</Text>
        <Text style={styles.subtitle}>Working days and timing</Text>
        <Text style={styles.caption}>Tap to select all the days you usually work.</Text>

        <View style={styles.dayWrap}>
          {weekDays.map((day) => {
            const selected = workingDays.includes(day);
            return (
              <Pressable key={day} style={[styles.dayChip, selected && styles.dayChipActive]} onPress={() => toggleDay(day)}>
                <Text style={[styles.dayText, selected && styles.dayTextActive]}>{day.slice(0, 3)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Start time</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeCell}>
            <SelectInput label="Hour" placeholder="HH" value={startHour} options={hourOptions} onSelect={setStartHour} />
          </View>
          <View style={styles.timeCell}>
            <SelectInput
              label="Minute"
              placeholder="MM"
              value={startMinute}
              options={minuteOptions}
              onSelect={setStartMinute}
            />
          </View>
          <View style={styles.timeCell}>
            <SelectInput
              label="AM/PM"
              placeholder="AM/PM"
              value={startMeridiem}
              options={meridiemOptions}
              onSelect={setStartMeridiem}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>End time</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeCell}>
            <SelectInput label="Hour" placeholder="HH" value={endHour} options={hourOptions} onSelect={setEndHour} />
          </View>
          <View style={styles.timeCell}>
            <SelectInput label="Minute" placeholder="MM" value={endMinute} options={minuteOptions} onSelect={setEndMinute} />
          </View>
          <View style={styles.timeCell}>
            <SelectInput label="AM/PM" placeholder="AM/PM" value={endMeridiem} options={meridiemOptions} onSelect={setEndMeridiem} />
          </View>
        </View>
        {!isTimeRangeValid && (
          <Text style={styles.errorText}>Start time must be earlier than end time.</Text>
        )}

        <FormInput
          label="Average weekly earnings (INR)"
          value={averageWeeklyEarnings}
          placeholder="Example: 5000"
          keyboardType="number-pad"
          onChangeText={setAverageWeeklyEarnings}
        />
        {!isEarningsValid && averageWeeklyEarnings.trim().length > 0 && (
          <Text style={styles.errorText}>Enter a valid earnings amount greater than zero.</Text>
        )}
        <Text style={styles.note}>Approximate timing is okay.</Text>
      </View>

      <PrimaryButton
        label="Next"
        disabled={workingDays.length === 0 || !isTimeRangeValid || !isEarningsValid}
        onPress={() => {
          updateOnboarding({
            workingDays,
            workStartTime: formatDisplayTime(startHour, startMinute, startMeridiem),
            workEndTime: formatDisplayTime(endHour, endMinute, endMeridiem),
            averageWeeklyEarnings: averageWeeklyEarnings.trim(),
          });
          navigation.navigate("PlanSelection");
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
  caption: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  dayWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.soft,
  },
  dayChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.text,
    fontWeight: "700",
  },
  dayTextActive: {
    color: colors.white,
  },
  note: {
    color: colors.muted,
    marginTop: 2,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.sm,
  },
  timeCell: {
    flex: 1,
  },
  errorText: {
    color: colors.primaryDark,
    marginTop: -8,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
  },
});
