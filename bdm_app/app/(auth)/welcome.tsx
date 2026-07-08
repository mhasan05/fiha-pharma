import { useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui";

const LOGO = require("../../assets/logo.png");

export default function WelcomeScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center">
        <Image source={LOGO} style={{ width: 132, height: 132 }} resizeMode="contain" />
        <Text className="mt-10 text-[30px] font-extrabold text-ink">Welcome to Fiha Pharma!</Text>
        <Text className="mt-2 text-[15px] text-ink-muted">Manage Your Orders. Smarter &amp; Faster.</Text>
      </View>

      <View className="gap-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <Button title="Log In" onPress={() => router.push("/(auth)/login")} />
        <Button title="Sign Up" variant="primaryOutline" onPress={() => router.push("/(auth)/signup")} />
      </View>
    </View>
  );
}
