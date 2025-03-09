import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { format } from "date-fns";
import { router } from "expo-router";

type AppointmentPatient = {
    id: string;
    name: string;
    profile_picture?: string;
    // other properties may exist
};

type Ticket = {
    id: string;
    ticket_number: string;
    status: string;
    notes?: string;
    qr_code?: string;
};

type Props = {
    id: string;
    patient: AppointmentPatient;
    date: string | Date;
    status: "pending" | "completed" | "cancelled";
    ticket?: Ticket;
    onPress?: () => void;
};

const DoctorAppointmentCard = ({
    id,
    patient,
    date,
    status,
    ticket,
    onPress
}: Props) => {
    const statusColors = {
        pending: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    // Format appointment date
    const formatAppointmentDate = (dateString: string | Date) => {
        try {
            const appointmentDate = new Date(dateString);
            return format(appointmentDate, "MMM dd, yyyy 'at' h:mm a");
        } catch (e) {
            console.error("Date formatting error:", e);
            return "Invalid date";
        }
    };

    // Default handler for card press
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // Navigate to chat with this patient
            router.push({
                pathname: "/(root)/chating",
                params: {
                    patientId: patient.id,
                    patientName: patient.name,
                    profilePicture: patient.profile_picture || `https://api.dicebear.com/9.x/initials/png?seed=${patient.name}`,
                    appointmentStatus: status
                }
            });
        }
    };

    return (
        <TouchableOpacity
            className="p-4 my-2 bg-white rounded-xl border border-gray-200"
            onPress={handlePress}
        >
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Image
                        source={{ uri: patient.profile_picture || `https://api.dicebear.com/9.x/initials/png?seed=${patient.name}` }}
                        className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3">
                        <Text className="font-JakartaBold text-lg">{patient.name}</Text>
                        <Text className="font-JakartaMedium text-gray-500">{formatAppointmentDate(date)}</Text>
                    </View>
                </View>
                <View className={`px-3 py-1 rounded-full ${statusColors[status]}`}>
                    <Text className="font-Jakarta capitalize">{status}</Text>
                </View>
            </View>
            {ticket && (
                <View className="mt-2">
                    <Text className="font-JakartaMedium text-gray-600">Ticket: {ticket.ticket_number}</Text>
                </View>
            )}
            {ticket?.notes && (
                <View className="mt-1">
                    <Text className="font-JakartaMedium text-gray-600 text-sm" numberOfLines={2}>{ticket.notes}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default DoctorAppointmentCard;
