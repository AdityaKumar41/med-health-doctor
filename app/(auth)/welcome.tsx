import React, { useEffect } from "react";
import { Image, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "react-native";
import { router } from "expo-router";
import { images } from "@/constants/image";
import { useAccount } from "wagmi";
import { useDoctor } from "@/hooks/useDoctor";

const Index = () => {

  const handleGetStarted = () => {
    router.replace("/(auth)/wallet");
  };

  const { address } = useAccount()
  const { data } = useDoctor(address!)
  console.log(data)

  useEffect(() => {
    if (data) {
      router.replace("/(root)/(tabs)");
    }
  }, [data]);

  return (
    <View className="flex-col items-center h-full w-full bg-white rounded-3xl max-w-[480px]">
      <View className="flex items-center justify-center w-full h-[500px]">
        <Image
          source={images.doctor}
          className="min-h-[500px]"
          resizeMode="contain"
        />
      </View>
      <View className="flex flex-col mt-11 px-3 w-full max-w-[343px]">
        <View className="flex flex-col w-full">
          <View className="text-2xl font-bold leading-9 text-zinc-900">
            <Text className="font-JakartaExtraBold text-3xl">
              Schedule Your First Appointment
            </Text>
          </View>
          <View className="mt-4 text-sm font-medium leading-6 text-zinc-700">
            <Text className="font-JakartaRegular text-lg">
              Choose a suitable time and date to meet your preferred doctor.
              Begin your journey to better health!
            </Text>
          </View>
        </View>
      </View>
      <View className="flex px-2 gap-4 items-start mt-10 w-full text-sm font-bold leading-6 text-white max-w-[343px]">
        <Button text="Get Started !" onClick={handleGetStarted} />
      </View>
    </View>
  );
};

export default Index;
