import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const API_BASE_URL = (extra.apiBaseUrl as string | undefined) ?? "http://localhost:8000";
export const GOOGLE_WEB_CLIENT_ID = (extra.googleWebClientId as string | undefined) ?? "";
export const GOOGLE_ANDROID_CLIENT_ID =
  (extra.googleAndroidClientId as string | undefined) ?? "";
