import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePatientsByIds } from '@/hooks/usePatient';
import { useDoctor } from '@/hooks/useDoctor';
import { useAccount } from 'wagmi';

interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  wallet_address: string;
  profile_picture: string;
  blood_group: string;
}

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const { address } = useAccount();
  const { data: doctorData, error: doctorError } = useDoctor(address!);
  const { data: patientsResponse, error: patientsError, isLoading } = usePatientsByIds(patientIds);

  // Extract patient IDs from doctor's appointments
  useEffect(() => {
    if (doctorData && doctorData.appointments) {
      const ids = [...new Set(doctorData.appointments.map((appointment: any) => appointment.patient_id))] as string[];
      setPatientIds(ids);
    }
  }, [doctorData]);

  // Get the most recent or active appointment for a patient
  const getCurrentAppointment = (patientId: string) => {
    if (!doctorData?.appointments) return null;

    // Filter appointments for this patient
    const patientAppointments = doctorData.appointments.filter(
      (appt: any) => appt.patient_id === patientId
    );

    if (patientAppointments.length === 0) return null;

    // First look for scheduled appointments (active)
    const scheduledAppointment = patientAppointments.find(
      (appt: any) => appt.status === 'scheduled'
    );

    if (scheduledAppointment) return scheduledAppointment;

    // Then look for pending appointments
    const pendingAppointment = patientAppointments.find(
      (appt: any) => appt.status === 'pending'
    );

    if (pendingAppointment) return pendingAppointment;

    // Sort by date and return the most recent one
    return patientAppointments.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
  };

  // check appointment status - now handles all statuses more clearly
  const getAppointmentStatus = (patientId: string) => {
    const appointment = getCurrentAppointment(patientId);
    return appointment ? appointment.status : null;
  };

  // handle chat press
  const handleChatPress = (patient: any) => {
    try {
      navigateToChat(patient);
    } catch (error) {
      console.error("Error navigating to chat:", error);
      Alert.alert("Error", "Could not open chat. Please try again.");
    }
  };

  // navigateToChat with proper status parameter
  const navigateToChat = (patient: any) => {
    const appointment = getCurrentAppointment(patient.id);

    if (appointment) {
      // Ensure we're sending the exact status string with string type
      const status = appointment.status ? String(appointment.status).trim() : 'unknown';

      // Add debug log to verify the status
      console.log("Navigating to chat with patient:", patient.name);
      console.log("Current appointment found with status:", status);
      console.log("Appointment details:", appointment);

      router.push({
        pathname: '/(root)/chating',
        params: {
          patientId: patient.id,
          patientName: patient.name,
          profilePicture: patient.profile_picture || 'https://via.placeholder.com/150',
          bloodGroup: patient.blood_group,
          appointmentStatus: status,
          appointmentId: appointment.id,
          debug: Date.now() // Add timestamp to force fresh params
        }
      });
    } else {
      // No appointment found
      console.log("No appointment found for patient:", patient.name);
      Alert.alert(
        "Cannot open chat",
        "No appointment found for this patient."
      );
    }
  };

  // check if appointment is pending
  const isAppointmentPending = (patientId: string) => {
    return getAppointmentStatus(patientId) === 'pending';
  };

  // check if appointment is scheduled (active)
  const isAppointmentScheduled = (patientId: string) => {
    return getAppointmentStatus(patientId) === 'scheduled';
  };

  // check if appointment is completed
  const isAppointmentCompleted = (patientId: string) => {
    return getAppointmentStatus(patientId) === 'completed';
  };

  // check if appointment is cancelled
  const isAppointmentCancelled = (patientId: string) => {
    return getAppointmentStatus(patientId) === 'cancelled';
  };

  // check if chat is locked (pending, completed, cancelled)
  const isChatLocked = (patientId: string) => {
    const status = getAppointmentStatus(patientId);
    return status === 'pending' || status === 'completed' || status === 'cancelled';
  };

  // check if chat is active (scheduled only)
  const isChatActive = (patientId: string) => {
    return getAppointmentStatus(patientId) === 'scheduled';
  };

  // filtered for search query
  const filteredPatients = useMemo(() => {
    if (!patientsResponse || !Array.isArray(patientsResponse.data) || !doctorData) return [];
    const patientIdsWithAppointments = new Set(doctorData.appointments.map((appt: any) => appt.patient_id));

    return patientsResponse.data.filter((patient: any) => {
      if (!patient || typeof patient.name !== 'string') return false;
      return patientIdsWithAppointments.has(patient.id) && patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [patientsResponse, searchQuery, doctorData]);

  return (
    <SafeAreaView className="flex-1 h-full bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-6 pb-4">
        <Text className="text-2xl font-JakartaBold text-gray-900">Patient Messages</Text>
        <Text className="text-base font-Jakarta text-gray-500 mt-1">
          Chat with your patients
        </Text>

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 font-Jakarta text-base"
            placeholder="Search patients..."
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
            <Text className="text-gray-500">No patients found.</Text>
          </View>
        ) : (
          filteredPatients.map((patient: Patient) => {
            const isPending = isAppointmentPending(patient.id);
            const isCompleted = isAppointmentCompleted(patient.id);
            const isCancelled = isAppointmentCancelled(patient.id);
            const isLocked = isChatLocked(patient.id);
            const status = getAppointmentStatus(patient.id);

            return (
              <TouchableOpacity
                key={patient.id}
                className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center"
                onPress={() => handleChatPress(patient)}
              >
                {/* Patient Avatar */}
                <View className="relative">
                  <Image
                    source={{ uri: patient.profile_picture || 'https://via.placeholder.com/150' }}
                    className="w-16 h-16 rounded-full"
                  />
                </View>

                {/* Chat Details */}
                <View className="flex-1 ml-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-JakartaBold text-gray-900 text-base">
                      {patient.name}
                    </Text>
                    {isLocked && (
                      <View className="flex-row items-center">
                        <Text className="text-xs text-gray-500 mr-1">Read-only</Text>
                        <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  <Text className="font-JakartaMedium text-xs text-blue-600 mb-1">
                    Age: {patient.age} • {patient.gender} • Blood: {patient.blood_group}
                  </Text>

                  {/* Status indicator with explicit status text */}
                  <View className="flex-row items-center">
                    <View className={`h-2 w-2 rounded-full mr-1 ${isPending ? 'bg-yellow-400' :
                      isCompleted ? 'bg-green-500' :
                        isCancelled ? 'bg-red-500' :
                          'bg-blue-500'
                      }`} />
                    <Text className="text-xs text-gray-500">
                      {status ? `${status}` : 'Unknown'}:
                      {isPending ? ' Pending approval' :
                        isCompleted ? ' Appointment completed' :
                          isCancelled ? ' Appointment cancelled' :
                            ' Active'}
                    </Text>
                  </View>

                  {/* Show multiple appointment indicator if applicable */}
                  {doctorData?.appointments?.filter((appt: any) => appt.patient_id === patient.id).length > 1 && (
                    <Text className="text-xs text-blue-500 mt-1">
                      Multiple appointments • Showing most recent
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default Chat;