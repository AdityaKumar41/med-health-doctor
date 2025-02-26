import React, { useEffect } from "react";
import { Image, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "react-native";
import { router } from "expo-router";
import { images } from "@/constants/image";
import { useAppKit } from "@reown/appkit-wagmi-react-native";
import { useAccount } from "wagmi";

const Wallet = () => {
  const { open } = useAppKit();
  const { address, chainId, status } = useAccount();

  useEffect(() => {
    if (address) {
      router.replace("/(auth)/register");
    }
  }, [address]);

  return (
    <View className="flex-col items-center h-full w-full bg-white rounded-3xl max-w-[480px]">
      <View className="flex items-center justify-center w-full h-[500px]">
        <Image
          source={images.walletImage}
          className="min-h-[500px]"
          resizeMode="contain"
        />
      </View>
      <View className="flex flex-col mt-11 w-full max-w-[343px]">
        <View className="flex flex-col w-full">
          <View className="text-2xl font-bold leading-9 text-zinc-900">
            <Text className="font-JakartaExtraBold text-3xl">PN - Health</Text>
          </View>
          <View className="mt-4 text-sm font-medium leading-6 text-zinc-700">
            <Text className="font-JakartaRegular text-lg">
              Begin your journey to better health!
            </Text>
          </View>
        </View>
      </View>
      <View className="flex gap-4 items-start mt-10 w-full text-sm font-bold leading-6 text-white max-w-[343px]">
        <Button text="Connect Wallet !" onClick={open} />
      </View>
      <View className="mt-12 p-6 text-sm font-medium leading-6 text-zinc-700">
        <Text className="font-JakartaRegular text-base text-center">
          By signing up or logging in, i accept the apps{" "}
          <Text className="text-blue-800">Terms of Service</Text> and{" "}
          <Text className="text-blue-800">Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

export default Wallet;
