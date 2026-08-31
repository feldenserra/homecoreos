import { Fraunces_600SemiBold, useFonts } from "@expo-google-fonts/fraunces";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth-context";
import { navScreenOptions, paperTheme } from "../theme/paper-theme";
import { colors } from "../theme/tokens";

/**
 * Root layout. Replaces the old app/layout.tsx.
 *
 * Provider order matters: GestureHandlerRootView has to be the outermost native
 * view or the kanban's pan gestures never receive touches, and SafeAreaProvider
 * has to be above PaperProvider so Paper's Appbar can read the insets.
 */

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold });

  useEffect(() => {
    // Hide on error too, otherwise a font CDN hiccup is an infinite splash.
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <StatusBar style="dark" backgroundColor={colors.paper} />
            <Stack screenOptions={navScreenOptions}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
