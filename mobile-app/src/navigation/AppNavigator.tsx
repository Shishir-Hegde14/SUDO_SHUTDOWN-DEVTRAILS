import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { SplashScreen } from "../screens/SplashScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { PersonalDetailsScreen } from "../screens/PersonalDetailsScreen";
import { WorkProfileScreen } from "../screens/WorkProfileScreen";
import { DeliveryZoneScreen } from "../screens/DeliveryZoneScreen";
import { QuoteScreen } from "../screens/QuoteScreen";
import { PlanSelectionScreen } from "../screens/PlanSelectionScreen";
import { PolicyConfirmationScreen } from "../screens/PolicyConfirmationScreen";
import { HomeDashboardScreen } from "../screens/HomeDashboardScreen";
import { ClaimsScreen } from "../screens/ClaimsScreen";
import { PayoutsScreen } from "../screens/PayoutsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PolicyDetailsScreen } from "../screens/PolicyDetailsScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { colors } from "../constants/theme";
import { useAppStore } from "../store/AppContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { authToken, isRestoringSession, onboarding } = useAppStore();

  if (isRestoringSession) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={authToken ? (onboarding.acceptedPolicy ? "MainApp" : "Login") : "Welcome"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: 260,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="WorkProfile" component={WorkProfileScreen} />
      <Stack.Screen name="DeliveryZone" component={DeliveryZoneScreen} />
      <Stack.Screen name="Quote" component={QuoteScreen} />
      <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
      <Stack.Screen name="PolicyConfirmation" component={PolicyConfirmationScreen} />
      <Stack.Screen name="MainApp" component={HomeDashboardScreen} />
      <Stack.Screen name="PolicyDetails" component={PolicyDetailsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Claims" component={ClaimsScreen} />
      <Stack.Screen name="Payouts" component={PayoutsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
