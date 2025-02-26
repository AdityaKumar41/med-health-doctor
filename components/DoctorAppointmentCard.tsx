import { View, Text, Image } from "react-native";
import React from "react";

type Props = {
    patientName: string;
    appointmentTime: string;
    status: "upcoming" | "completed" | "cancelled";
    symptoms: string;
};

const DoctorAppointmentCard = ({
    patientName,
    appointmentTime,
    status,
    symptoms,
}: Props) => {
    const statusColors = {
        upcoming: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    return (
        <View className="p-4 my-2 bg-white rounded-xl border border-gray-200">
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Image
                        source={{ uri: `https://api.dicebear.com/9.x/initials/png?seed=${patientName}` }}
                        className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3">
                        <Text className="font-JakartaBold text-lg">{patientName}</Text>
                        <Text className="font-JakartaMedium text-gray-500">{appointmentTime}</Text>
                    </View>
                </View>
                <View className={`px-3 py-1 rounded-full ${statusColors[status]}`}>
                    <Text className="font-Jakarta">{status}</Text>
                </View>
            </View>
            <View className="mt-3">
                <Text className="font-JakartaMedium text-gray-600">Symptoms: {symptoms}</Text>
            </View>
        </View>
    );
};

export default DoctorAppointmentCard;
