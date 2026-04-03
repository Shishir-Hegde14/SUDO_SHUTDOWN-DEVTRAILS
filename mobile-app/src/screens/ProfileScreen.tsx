import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SelectInput } from "../components/SelectInput";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAppStore } from "../store/AppContext";

export function ProfileScreen() {
  const { onboarding, updateOnboarding, clearAuthSession } = useAppStore();

  const [fullName, setFullName] = useState(onboarding.fullName);
  const [gender, setGender] = useState(onboarding.gender);
  const [email, setEmail] = useState(onboarding.email);
  const [phone, setPhone] = useState(onboarding.phone);
  const [homeAddress, setHomeAddress] = useState(onboarding.homeAddress);
  const [workApp, setWorkApp] = useState(onboarding.workApp);
  const [otherWorkApp, setOtherWorkApp] = useState(onboarding.otherWorkApp);
  const [vehicleType, setVehicleType] = useState(onboarding.vehicleType);
  const [workingDaysText, setWorkingDaysText] = useState(onboarding.workingDays.join(", "));
  const [workStartTime, setWorkStartTime] = useState(onboarding.workStartTime);
  const [workEndTime, setWorkEndTime] = useState(onboarding.workEndTime);
  const [workAreaCenter, setWorkAreaCenter] = useState(onboarding.workAreaCenter);
  const [workAreaRegion, setWorkAreaRegion] = useState(onboarding.workAreaRegion);
  const [bankName, setBankName] = useState(onboarding.bankName);
  const [bankAccountNumber, setBankAccountNumber] = useState(onboarding.bankAccountNumber);
  const [bankAddress, setBankAddress] = useState(onboarding.bankAddress);
  const [profileImageUri, setProfileImageUri] = useState(onboarding.profileImageUri);

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const saveProfile = () => {
    updateOnboarding({
      fullName: fullName.trim(),
      gender,
      email: email.trim(),
      phone: phone.trim(),
      homeAddress: homeAddress.trim(),
      workApp,
      otherWorkApp: workApp === "Other" ? otherWorkApp.trim() : "",
      vehicleType,
      workingDays: workingDaysText
        .split(",")
        .map((day) => day.trim())
        .filter(Boolean),
      workStartTime: workStartTime.trim(),
      workEndTime: workEndTime.trim(),
      workAreaCenter: workAreaCenter.trim(),
      workAreaRegion: workAreaRegion.trim(),
      bankName,
      bankAccountNumber: bankAccountNumber.trim(),
      bankAddress: bankAddress.trim(),
      profileImageUri,
    });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarWrap}>
        {profileImageUri ? <Image source={{ uri: profileImageUri }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(fullName[0] || "U").toUpperCase()}</Text></View>}
      </View>
      <PrimaryButton label="Upload Profile Photo" variant="secondary" onPress={pickProfileImage} />

      <FormInput label="Name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
      <SelectInput
        label="Gender"
        placeholder="Select gender"
        value={gender}
        options={["Male", "Female", "Other", "Prefer not to say"]}
        onSelect={setGender}
      />
      <FormInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormInput label="Phone" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
      <FormInput label="Address" value={homeAddress} onChangeText={setHomeAddress} placeholder="Enter address" />

      <SelectInput
        label="Work app"
        placeholder="Select app"
        value={workApp}
        options={["Swiggy", "Zomato", "Blinkit", "Zepto", "Dunzo", "Other"]}
        onSelect={setWorkApp}
      />
      {workApp === "Other" && (
        <FormInput label="Other app" value={otherWorkApp} onChangeText={setOtherWorkApp} placeholder="Enter app name" />
      )}
      <SelectInput
        label="Vehicle type"
        placeholder="Select vehicle"
        value={vehicleType}
        options={["Bike", "Scooter", "Car", "Cycle", "Truck"]}
        onSelect={setVehicleType}
      />
      <FormInput label="Working days" value={workingDaysText} onChangeText={setWorkingDaysText} placeholder="Monday, Tuesday" />
      <FormInput label="Work start time" value={workStartTime} onChangeText={setWorkStartTime} placeholder="Enter start time" />
      <FormInput label="Work end time" value={workEndTime} onChangeText={setWorkEndTime} placeholder="Enter end time" />
      <FormInput label="Work area center" value={workAreaCenter} onChangeText={setWorkAreaCenter} placeholder="Enter coordinates" />
      <FormInput label="Work area region" value={workAreaRegion} onChangeText={setWorkAreaRegion} placeholder="Enter region" />

      <SelectInput
        label="Bank"
        placeholder="Select bank"
        value={bankName}
        options={["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"]}
        onSelect={setBankName}
      />
      <FormInput
        label="Bank account number"
        value={bankAccountNumber}
        onChangeText={setBankAccountNumber}
        placeholder="Enter account number"
        keyboardType="number-pad"
      />
      <FormInput label="Bank address" value={bankAddress} onChangeText={setBankAddress} placeholder="Enter bank address" />

      <PrimaryButton label="Save Profile" onPress={saveProfile} />
      <PrimaryButton label="Sign Out" variant="secondary" onPress={() => void clearAuthSession()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.heading,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
  },
});
