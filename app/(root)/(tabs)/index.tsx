import { View, Text, TextInput, ScrollView, Image, ActivityIndicator } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { images } from "@/constants/image";
import { router, useFocusEffect } from "expo-router";
import { useAccount } from "wagmi";
import DoctorAppointmentCard from "@/components/DoctorAppointmentCard";
import { ServiceCard } from "@/components/ServiceCard";
import { useDoctor } from "@/hooks/useDoctor";
import { useAppointmentPending } from "@/hooks/useAppointment"
import { AppointmentData, AppointmentApiResponse } from "@/types/type";

const services = [
  {
    bgColor: "bg-blue-50",
    title: "View Appointments",
    description: "Check your schedule",
    imageUri: images.appointment,
    onPress: () => router.push("/(root)/(tabs)/chat"), //appointments
  },
  {
    bgColor: "bg-green-50",
    title: "Patient Records",
    description: "Access medical histories",
    imageUri: images.book,
    onPress: () => router.push("/(root)/patient-record"),
  },
  {
    bgColor: "bg-purple-50",
    title: "Consultations",
    description: "Scan patient QR code",
    imageUri: images.request,
    onPress: () => router.push("/(root)/barcode-scanner"),
  },
  {
    bgColor: "bg-orange-50",
    title: "Update Schedule",
    description: "Set availability",
    imageUri: images.pharmacy,
    onPress: () => router.push("/(root)/(tabs)/chat"),
  },
];

const Home = () => {
  const firstTimeRef = React.useRef(true)
  const { address } = useAccount();
  const { data, refetch, error } = useDoctor(address!);
  const { data: appointmentResponse, isLoading: appointmentsLoading } = useAppointmentPending(address!);

  // Extract appointments from the response
  const appointments = React.useMemo(() => {
    return appointmentResponse?.data || [];
  }, [appointmentResponse]);

  console.log(data)
  console.log(error)

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch()
    }, [refetch])
  );


  return (
    <SafeAreaView>
      <ScrollView className="bg-white">
        <View className="flex overflow-hidden flex-col mx-auto w-full rounded-3xl max-w-[480px]">
          <View className="flex flex-col p-4 w-full">
            <View className="flex flex-row gap-10 justify-between items-center w-full">
              <View className="flex flex-col self-stretch my-auto tracking-wide">
                <Text className="font-JakartaExtraBold text-2xl">Hello {data?.name}</Text>
                <Text className="font-Jakarta text-base text-zinc-700">
                  Welcome back to your practice
                </Text>
              </View>
              <View className="flex overflow-hidden gap-3 justify-center items-center self-stretch p-5 my-auto w-8 h-8 bg-gray-50 rounded-lg border border-solid shadow-sm">
                <Image source={require("@/assets/icon/bell.png")} />
              </View>
            </View>

            <View className="mt-6">
              <Text className="font-JakartaBold text-lg mb-2">Today's Appointments</Text>

              {appointmentsLoading ? (
                <View className="py-8 flex items-center justify-center">
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : appointments.length > 0 ? (
                appointments.map((appointment: AppointmentData) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    id={appointment.id}
                    patient={appointment.patient}
                    date={appointment.date}
                    status={appointment.status as "pending" | "completed" | "cancelled"}
                    ticket={appointment.ticket}
                  />
                ))
              ) : (
                <View className="py-8 flex items-center justify-center">
                  <Text className="font-Jakarta text-gray-500">No pending appointments</Text>
                </View>
              )}
            </View>

            <View className="mt-6">
              <Text className="font-JakartaBold text-lg mb-4">Quick Actions</Text>
              <View className="flex items-center justify-center flex-wrap flex-row gap-4">
                {services.map((service, index) => (
                  <ServiceCard key={index} {...service} />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default Home;
