import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

const doctorsData: Doctor[] = [
  {
    id: "1",
    name: "Dr. Patricia Ahoy",
    specialty: "Cardiologist",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/png?seed=DoctorDon",
    isOnline: true,
    lastMessage: "Your heart rate looks normal, but let's schedule...",
    lastMessageTime: "2m ago",
    unreadCount: 2
  },
  {
    id: "2",
    name: "Dr. Stone Gaze",
    specialty: "Neurologist",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/png?seed=DoctorStone",
    isOnline: false,
    lastMessage: "Please send me your latest test results",
    lastMessageTime: "1h ago"
  },
  // ...add more doctors with similar structure
];

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChatPress = (doctorId: string) => {
    router.push("/(root)/chating");
    // router.push(`/(root)/conversation/${doctorId}`);
  };

  return (
    <SafeAreaView className="flex-1 h-full bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-6 pb-4">
        <Text className="text-2xl font-JakartaBold text-gray-900">Messages</Text>
        <Text className="text-base font-Jakarta text-gray-500 mt-1">
          Chat with your healthcare providers
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
        {doctorsData.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center"
            onPress={() => handleChatPress(doctor.id)}
          >
            {/* Doctor Avatar with Online Status */}
            <View className="relative">
              <Image
                source={{ uri: doctor.imageUrl }}
                className="w-16 h-16 rounded-full"
              />
              {doctor.isOnline && (
                <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            {/* Chat Details */}
            <View className="flex-1 ml-4">
              <View className="flex-row justify-between items-center">
                <Text className="font-JakartaBold text-gray-900 text-base">
                  {doctor.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {doctor.lastMessageTime}
                </Text>
              </View>

              <Text className="font-JakartaMedium text-xs text-blue-600 mb-1">
                {doctor.specialty}
              </Text>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 font-Jakarta text-sm" numberOfLines={1}>
                  {doctor.lastMessage}
                </Text>
                {doctor.unreadCount && (
                  <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-JakartaBold">
                      {doctor.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default Chat;