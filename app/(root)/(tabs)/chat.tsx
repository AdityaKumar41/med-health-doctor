import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useDoctor } from '@/hooks/useDoctor';
import { useAccount } from 'wagmi';
import { usePatientsById } from '@/hooks/usePatient';
import { AppointmentSchema } from '@/types/type';

interface Patient {
  profile_picture: string | undefined;
  id: string;
  name: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const { address } = useAccount();
  const { data: doctorData, error: doctorError } = useDoctor(address!);
  const { data: patientsResponse, error: patientsError, isLoading } = usePatientsById(patientIds);

  useEffect(() => {
    if (doctorData) {
      const ids = [...new Set(doctorData.appointments?.map((appointment: AppointmentSchema) => appointment.patient_id))] as string[];
      setPatientIds(ids);
    }
  }, [doctorData]);

  const handleChatPress = (patientId: string) => {
    const appointment = doctorData.appointments.find((appt: any) => appt.patient_id === patientId);
    if (appointment && appointment.status === 'pending') {
      router.push({ pathname: '/(root)/chating', params: { patientId } });
    }
  };

  const filteredPatients = useMemo(() => {
    if (!patientsResponse || !Array.isArray(patientsResponse.data)) return [];
    return patientsResponse.data.filter((patient: any) => {
      if (!patient || typeof patient.name !== 'string') return false;
      return patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [patientsResponse, searchQuery]);

  return (
    <SafeAreaView className="flex-1 h-full bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-6 pb-4">
        <Text className="text-2xl font-JakartaBold text-gray-900">Messages</Text>
        <Text className="text-base font-Jakarta text-gray-500 mt-1">
          Chat with your patients
        </Text>

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 font-Jakarta text-base"
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-2">Loading patients...</Text>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">No appointments found.</Text>
          </View>
        ) : (
          filteredPatients.map((patient: Patient) => (
            <TouchableOpacity
              key={patient.id}
              className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center"
              onPress={() => handleChatPress(patient.id)}
              disabled={!doctorData.appointments.some((appt: any) => appt.patient_id === patient.id && appt.status === 'pending')}
            >
              {/* Patient Avatar with Online Status */}
              <View className="relative">
                <Image
                  source={{ uri: patient.profile_picture }}
                  className="w-16 h-16 rounded-full"
                />
                {patient.isOnline && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </View>

              {/* Chat Details */}
              <View className="flex-1 ml-4">
                <View className="flex-row justify-between items-center">
                  <Text className="font-JakartaBold text-gray-900 text-base">
                    {patient.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {/* {patient.lastMessageTime} */}
                    12:00 PM
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500 font-Jakarta text-sm" numberOfLines={1}>
                    {/* {patient.lastMessage} */}
                    Good take care
                  </Text>
                  {patient.unreadCount && (
                    <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                      <Text className="text-white text-xs font-JakartaBold">
                        {/* {patient.unreadCount} */}
                        2
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default Chat;