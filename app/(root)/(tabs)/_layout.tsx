import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#254EDB",
        tabBarInactiveTintColor: "#A1A1AA",

        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.2,
          borderColor: "#7B7B7B",
          elevation: 0,
          shadowColor: "#000",

          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Jakarta-SemiBold",
          fontWeight: "500",
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: -5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home-filled" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="chat" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-circle" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
