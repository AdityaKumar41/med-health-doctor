import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import "../global.css"
import 'react-native-reanimated';
import "@walletconnect/react-native-compat";
import { WagmiProvider } from "wagmi";
import { polygonAmoy, polygonZkEvmTestnet } from "@wagmi/core/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createAppKit,
  defaultWagmiConfig,
  AppKit,
  AppKitButton,
} from "@reown/appkit-wagmi-react-native";
import { ChatProvider } from '@/context/ChatContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const queryClient = new QueryClient();

const projectId = process.env.EXPO_PUBLIC_PROJECT_ID!;

const metadata = {
  name: "AppKit RN",
  description: "AppKit RN Example",
  url: "https://reown.com/appkit",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
  redirect: {
    native: "YOUR_APP_SCHEME://",
    universal: "YOUR_APP_UNIVERSAL_LINK.com",
  },
};

const chains = [polygonAmoy, polygonZkEvmTestnet] as const;

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: polygonAmoy, // Optional
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notification handler for the app
const configureNotifications = () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Create notification channels for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('chat-messages', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });
  }

  // Listen for notification interactions at the app level
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    if (data.senderId) {
      // Navigate to chat with this patient when notification is tapped
      router.push({
        pathname: "/(root)/chating",
        params: {
          patientId: data.senderId,
          patientName: data.senderName || 'Patient'
        }
      });
    }
  });
};

export default function RootLayout() {
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "Jakarta-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  // Setup notifications when app loads
  useEffect(() => {
    const notificationSubscription = configureNotifications();

    // Clean up notification listener when component unmounts
    return () => {
      notificationSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ChatProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(root)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <AppKit />
            <StatusBar style="dark" />
          </ChatProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
