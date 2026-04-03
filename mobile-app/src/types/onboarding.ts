export type PlanType = "Basic" | "Super";
export type QuotePlan = {
  name: string;
  premium: number;
  coverage: number;
  fuel_liability_cover?: number;
  benefits?: string[];
};

export type PurchasedPolicy = {
  policyId: string;
  planName: string;
  premium: number;
  coverage: number;
  payoutDate: string;
  status: string;
};

export type OnboardingData = {
  fullName: string;
  gender: string;
  email: string;
  phone: string;
  homeAddress: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  workApp: string;
  otherWorkApp: string;
  vehicleType: string;
  workingDays: string[];
  workStartTime: string;
  workEndTime: string;
  averageWeeklyEarnings: string;
  workAreaCenter: string;
  workAreaRegion: string;
  workAreaLatitude: number | null;
  workAreaLongitude: number | null;
  workAreaState: string;
  bankName: string;
  bankAccountNumber: string;
  bankAddress: string;
  profileImageUri: string;
  city: string;
  experienceYears: string;
  preferredZone: string;
  selectedPlan: PlanType;
  quotePremium: number | null;
  quoteId: string;
  quoteWeekStart: string;
  quotePlans: QuotePlan[];
  quoteDate: string;
  quoteRiskReason: string;
  protectedFactors: string[];
  purchasedPolicy: PurchasedPolicy | null;
  policyPurchased: boolean;
  acceptedPolicy: boolean;
};

export const initialOnboardingData: OnboardingData = {
  fullName: "",
  gender: "",
  email: "",
  phone: "",
  homeAddress: "",
  homeLatitude: null,
  homeLongitude: null,
  workApp: "",
  otherWorkApp: "",
  city: "",
  vehicleType: "",
  workingDays: [],
  workStartTime: "",
  workEndTime: "",
  averageWeeklyEarnings: "",
  workAreaCenter: "",
  workAreaRegion: "",
  workAreaLatitude: null,
  workAreaLongitude: null,
  workAreaState: "",
  bankName: "",
  bankAccountNumber: "",
  bankAddress: "",
  profileImageUri: "",
  experienceYears: "",
  preferredZone: "",
  selectedPlan: "Basic",
  quotePremium: null,
  quoteId: "",
  quoteWeekStart: "",
  quotePlans: [],
  quoteDate: "",
  quoteRiskReason: "",
  protectedFactors: [],
  purchasedPolicy: null,
  policyPurchased: false,
  acceptedPolicy: false,
};
