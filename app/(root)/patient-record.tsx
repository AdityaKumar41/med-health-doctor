import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, router } from "expo-router";
import { useAccount } from "wagmi";
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DoctorAppointmentCard from "@/components/DoctorAppointmentCard";
import { useDoctor } from "@/hooks/useDoctor";
import { useAppointment, useAppointmentApprove, useAppointmentComplete } from "@/hooks/useAppointment";
import { format } from "date-fns";
import { AppointmentData, FormattedAppointment, Patient } from "@/types/type";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useTicketResolve } from "@/hooks/useTicket";

const PatientRecordScreen = () => {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const { data: doctorData } = useDoctor(address!);
    const { data: appointmentData, isLoading, error } = useAppointment(address!);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
    const [selectedAppointment, setSelectedAppointment] = useState<FormattedAppointment | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState<"appointments" | "history">("appointments");
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [isCompletingAppointment, setIsCompletingAppointment] = useState(false);
    const { mutate } = useAppointmentApprove(address!);
    const { mutate: completeAppointment } = useAppointmentComplete(address!);
    const { mutate: resolveTicket } = useTicketResolve(address!);

    const handleApproveAppointment = async (appointmentId: string) => {
        try {
            mutate({
                appointmentId,
                status: "scheduled",
            });

            setIsModalVisible(false);

        } catch (error) {
            console.error("Error approving appointment:", error);
        }
    }

    const handleCompleteAppointment = async (appointmentId: string, ticketId?: string) => {
        try {
            setIsCompletingAppointment(true);

            // First mark the appointment as completed
            completeAppointment({
                appointmentId,
                status: "completed",
            }, {
                onSuccess: () => {
                    // If there's a ticket associated, also resolve it
                    if (ticketId) {
                        resolveTicket(
                            { ticketId },
                            {
                                onSuccess: () => {
                                    console.log("Ticket resolved successfully");
                                },
                                onError: (error) => {
                                    console.error("Error resolving ticket:", error);
                                    // Continue with success flow even if ticket resolution fails
                                }
                            }
                        );
                    }

                    setIsModalVisible(false);
                    // Refresh appointment data
                    queryClient.invalidateQueries({ queryKey: ["appointmentquery"] });
                    Alert.alert("Success", "Appointment marked as completed!");
                },
                onError: (error) => {
                    console.error("Error completing appointment:", error);
                    Alert.alert("Error", "Failed to mark appointment as complete.");
                },
                onSettled: () => {
                    setIsCompletingAppointment(false);
                }
            });
        } catch (error) {
            console.error("Error completing appointment:", error);
            setIsCompletingAppointment(false);
            Alert.alert("Error", "An unexpected error occurred.");
        }
    }

    // Format and separate appointments based on status
    const formatAppointments = () => {
        if (!appointmentData?.data) return { pending: [], history: [] };

        const pending: FormattedAppointment[] = [];
        const history: FormattedAppointment[] = [];

        appointmentData.data.forEach((appointment: AppointmentData) => {
            const appointmentDate = new Date(appointment.date);
            const formattedDate = format(appointmentDate, "MMM dd, hh:mm a");
            const isPending = appointment.status === "pending";

            const formattedAppointment: FormattedAppointment = {
                id: appointment.id,
                patientName: appointment.patient.name,
                appointmentTime: formattedDate,
                status: appointment.status || "pending",
                symptoms: appointment.ticket?.notes || "No symptoms provided",
                profilePicture: appointment.patient.profile_picture,
                patientDetails: appointment.patient,
                ticketDetails: appointment.ticket,
                appointmentDate: appointmentDate
            };

            if (isPending) {
                pending.push(formattedAppointment);
            } else {
                history.push(formattedAppointment);
            }
        });

        // Sort pending by date (nearest first)
        pending.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
        // Sort history by date (most recent first)
        history.sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());

        return { pending, history };
    };

    const { pending: pendingAppointments, history: appointmentHistory } = formatAppointments();

    // Filter appointments based on search query
    const filteredPending = pendingAppointments.filter(app =>
        app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.symptoms.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = appointmentHistory.filter(app =>
        app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAppointmentPress = (appointment: FormattedAppointment) => {
        setSelectedAppointment(appointment);
        setIsModalVisible(true);
    };

    const fetchPatientHistory = async (patientId: string) => {
        if (!address) return;

        setIsLoadingHistory(true);
        setHistoryError(null);

        try {
            const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/patients/${patientId}/records`;
            const response = await axios({
                method: "get",
                url: apiUrl,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${address}`,
                },
            });

            setPatientHistory(response.data.data || []);
        } catch (error: any) {
            console.error("Error fetching patient history:", error);
            setHistoryError("Failed to load patient history. Please try again.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const viewPatientHistory = (patient: Patient) => {
        setSelectedPatient(patient);
        setViewMode("history");
        fetchPatientHistory(patient.id);
    };

    // Function to get status color based on status
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'scheduled':
                return 'bg-blue-100 text-blue-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            case 'no-show':
                return 'bg-orange-100 text-orange-700';
            case 'pending':
            case 'requested':
            default:
                return 'bg-yellow-100 text-yellow-700';
        }
    };

    // Enhanced appointment card rendering
    const renderAppointmentCard = (appointment: FormattedAppointment) => {
        const statusColors = getStatusColor(appointment.status);

        return (
            <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start">
                    <View className="flex-row items-center">
                        {appointment.profilePicture ? (
                            <Image
                                source={{ uri: appointment.profilePicture }}
                                className="w-12 h-12 rounded-full mr-3"
                            />
                        ) : (
                            <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center">
                                <Ionicons name="person" size={20} color="#777" />
                            </View>
                        )}
                        <View>
                            <Text className="font-JakartaBold text-base">{appointment.patientName}</Text>
                            <Text className="font-Jakarta text-gray-500 text-sm">{appointment.appointmentTime}</Text>
                            <View className={`px-2 py-1 rounded-full mt-1 self-start ${statusColors.split(' ')[0]}`}>
                                <Text className={`text-xs font-JakartaBold ${statusColors.split(' ')[1]}`}>
                                    {appointment.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        className="bg-gray-100 p-2 rounded-full"
                        onPress={() => handleAppointmentPress(appointment)}
                    >
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <View className="bg-gray-50 p-3 rounded-lg mt-3">
                    <Text className="font-JakartaMedium text-sm text-gray-700">Symptoms/Notes:</Text>
                    <Text className="font-Jakarta text-gray-600 mt-1" numberOfLines={2}>
                        {appointment.symptoms}
                    </Text>
                </View>

                {appointment.ticketDetails && (
                    <View className="flex-row items-center mt-2">
                        <FontAwesome5 name="ticket-alt" size={12} color="#666" />
                        <Text className="font-Jakarta text-xs text-gray-500 ml-1">
                            Ticket #{appointment.ticketDetails.ticket_number}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Appointment details modal component
    const AppointmentDetailsModal = () => {
        if (!selectedAppointment) return null;

        // Get appropriate status colors for the modal
        const statusColors = getStatusColor(selectedAppointment.status);
        const isAppointmentPending = selectedAppointment.status === "pending";
        const isAppointmentScheduled = selectedAppointment.status === "scheduled";
        const isAppointmentCompleted = selectedAppointment.status === "completed";
        const canTakeAction = isAppointmentPending || isAppointmentScheduled;

        return (
            <Modal
                transparent={true}
                visible={isModalVisible}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-5 h-4/5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="font-JakartaBold text-xl">Appointment Details</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Patient header info */}
                        <View className="bg-blue-50 p-4 rounded-xl mb-4">
                            <View className="flex-row items-center">
                                {selectedAppointment.profilePicture ? (
                                    <Image
                                        source={{ uri: selectedAppointment.profilePicture }}
                                        className="w-12 h-12 rounded-full mr-3"
                                    />
                                ) : (
                                    <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center">
                                        <Ionicons name="person" size={20} color="#777" />
                                    </View>
                                )}
                                <View>
                                    <Text className="font-JakartaBold text-lg">{selectedAppointment.patientName}</Text>
                                    <Text className="font-Jakarta text-gray-700 mt-1">{selectedAppointment.appointmentTime}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <View className={`px-3 py-1 rounded-full ${statusColors.split(' ')[0]}`}>
                                    <Text className={`text-xs font-JakartaBold ${statusColors.split(' ')[1]}`}>
                                        {selectedAppointment.status.toUpperCase()}
                                    </Text>
                                </View>
                                {selectedAppointment.patientDetails?.blood_group && (
                                    <View className="px-3 py-1 rounded-full bg-red-100 ml-2">
                                        <Text className="text-xs font-JakartaBold text-red-700">
                                            {selectedAppointment.patientDetails.blood_group}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Patient Info */}
                        <View className="mb-4">
                            <Text className="font-JakartaBold text-base mb-2">Patient Information</Text>
                            <View className="bg-gray-50 p-3 rounded-lg">
                                <Text className="font-Jakarta">Age: {selectedAppointment.patientDetails?.age || 'N/A'}</Text>
                                <Text className="font-Jakarta">Gender: {selectedAppointment.patientDetails?.gender || 'N/A'}</Text>
                                <Text className="font-Jakarta">Email: {selectedAppointment.patientDetails?.email || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Symptoms and notes */}
                        <View className="mb-4">
                            <Text className="font-JakartaBold text-base mb-2">Symptoms/Notes</Text>
                            <View className="bg-gray-50 p-3 rounded-lg">
                                <Text className="font-Jakarta">{selectedAppointment.symptoms}</Text>
                            </View>
                        </View>

                        {/* Ticket Info */}
                        {selectedAppointment.ticketDetails && (
                            <View className="mb-4">
                                <Text className="font-JakartaBold text-base mb-2">Ticket Information</Text>
                                <View className="bg-gray-50 p-3 rounded-lg">
                                    <Text className="font-Jakarta">Ticket #: {selectedAppointment.ticketDetails.ticket_number}</Text>
                                    <Text className="font-Jakarta">Status: {selectedAppointment.ticketDetails.status}</Text>
                                </View>
                            </View>
                        )}

                        {/* Action buttons - different for pending vs scheduled vs completed */}
                        <View className="flex-row gap-3 mt-auto">
                            {isAppointmentPending ? (
                                <>
                                    <TouchableOpacity
                                        className="flex-1 bg-blue-600 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => handleApproveAppointment(selectedAppointment.id)}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                        <Text className="text-white font-JakartaBold ml-2">Approve Appointment</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 border border-red-500 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            // Add your cancel appointment logic here
                                        }}
                                    >
                                        <Text className="text-red-500 font-JakartaBold">Reject</Text>
                                    </TouchableOpacity>
                                </>
                            ) : isAppointmentScheduled ? (
                                <>
                                    <TouchableOpacity
                                        className="flex-1 bg-blue-600 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => {
                                            // Navigate to chat with proper appointment status
                                            router.push({
                                                pathname: '/chating',
                                                params: {
                                                    patientId: selectedAppointment.patientDetails?.id,
                                                    patientName: selectedAppointment.patientDetails?.name,
                                                    profilePicture: selectedAppointment.patientDetails?.profile_picture || 'https://via.placeholder.com/150',
                                                    bloodGroup: selectedAppointment.patientDetails?.blood_group,
                                                    appointmentStatus: 'scheduled' // Pass active status
                                                }
                                            });
                                        }}
                                    >
                                        <Ionicons name="videocam" size={20} color="white" />
                                        <Text className="text-white font-JakartaBold ml-2">Start Consultation</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 border border-green-500 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => handleCompleteAppointment(
                                            selectedAppointment.id,
                                            selectedAppointment.ticketDetails?.id
                                        )}
                                        disabled={isCompletingAppointment}
                                    >
                                        {isCompletingAppointment ? (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-done" size={20} color="#10B981" />
                                                <Text className="text-green-500 font-JakartaBold ml-2">Mark as Complete</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : isAppointmentCompleted ? (
                                <>
                                    <TouchableOpacity
                                        className="flex-1 bg-blue-600 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            if (selectedAppointment.patientDetails) {
                                                viewPatientHistory(selectedAppointment.patientDetails);
                                            }
                                        }}
                                    >
                                        <Ionicons name="document-text" size={20} color="white" />
                                        <Text className="text-white font-JakartaBold ml-2">View Medical Records</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 border border-blue-500 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => {
                                            // Navigate to read-only chat with appointment status parameter
                                            router.push({
                                                pathname: '/chating',
                                                params: {
                                                    patientId: selectedAppointment.patientDetails?.id,
                                                    patientName: selectedAppointment.patientDetails?.name,
                                                    profilePicture: selectedAppointment.patientDetails?.profile_picture || 'https://via.placeholder.com/150',
                                                    bloodGroup: selectedAppointment.patientDetails?.blood_group,
                                                    appointmentStatus: selectedAppointment.status
                                                }
                                            });
                                        }}
                                    >
                                        <Ionicons name="eye" size={20} color="#3b82f6" />
                                        <Text className="text-blue-500 font-JakartaBold ml-2">View Chat History</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // For cancelled or other statuses - add view chat history option for cancelled too
                                <>
                                    <TouchableOpacity
                                        className="flex-1 bg-gray-400 py-3 rounded-xl flex-row justify-center items-center"
                                        onPress={() => setIsModalVisible(false)}
                                    >
                                        <Text className="text-white font-JakartaBold">Close</Text>
                                    </TouchableOpacity>
                                    {selectedAppointment.status === 'cancelled' && (
                                        <TouchableOpacity
                                            className="flex-1 border border-blue-500 py-3 rounded-xl flex-row justify-center items-center"
                                            onPress={() => {
                                                // Navigate to read-only chat for cancelled appointments too
                                                router.push({
                                                    pathname: '/chating',
                                                    params: {
                                                        patientId: selectedAppointment.patientDetails?.id,
                                                        patientName: selectedAppointment.patientDetails?.name,
                                                        profilePicture: selectedAppointment.patientDetails?.profile_picture || 'https://via.placeholder.com/150',
                                                        bloodGroup: selectedAppointment.patientDetails?.blood_group,
                                                        appointmentStatus: 'cancelled'
                                                    }
                                                });
                                            }}
                                        >
                                            <Ionicons name="eye" size={20} color="#3b82f6" />
                                            <Text className="text-blue-500 font-JakartaBold ml-2">View Chat History</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // Patient History Record Card Component
    const HistoryRecordCard = ({ record }: { record: any }) => {
        return (
            <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start">
                    <View className="flex-row items-center">
                        <View className="bg-blue-100 p-2 rounded-lg mr-3">
                            <FontAwesome5
                                name={record.record_type === "prescription" ? "prescription-bottle" :
                                    record.record_type === "lab_result" ? "flask" :
                                        record.record_type === "diagnosis" ? "stethoscope" : "file-medical"}
                                size={16}
                                color="#0066cc"
                            />
                        </View>
                        <View>
                            <Text className="font-JakartaBold text-base">{record.title}</Text>
                            <Text className="font-Jakarta text-gray-500 text-sm">
                                {format(new Date(record.created_at), "MMM dd, yyyy")}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        className="bg-gray-100 p-2 rounded-full"
                        onPress={() => {
                            // Handle view/download record
                            if (record.file_url) {
                                // Open file URL
                            }
                        }}
                    >
                        <Ionicons name="eye-outline" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text className="font-Jakarta text-gray-700 mt-3" numberOfLines={2}>
                    {record.description}
                </Text>

                {record.record_type === "prescription" && (
                    <View className="bg-blue-50 mt-3 p-3 rounded-lg">
                        <Text className="font-JakartaMedium text-sm">Medication: {record.medication || "Not specified"}</Text>
                        <Text className="font-JakartaMedium text-sm mt-1">Dosage: {record.dosage || "Not specified"}</Text>
                    </View>
                )}
            </View>
        );
    };

    // Render the patient history view
    const renderPatientHistory = () => {
        if (!selectedPatient) {
            return (
                <View className="flex-1 justify-center items-center">
                    <Text className="font-JakartaMedium text-gray-500">No patient selected</Text>
                </View>
            );
        }

        return (
            <View className="flex-1">
                {/* Patient header */}
                <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                    <View className="flex-row items-center">
                        {selectedPatient.profile_picture && (
                            <Image
                                source={{ uri: selectedPatient.profile_picture }}
                                className="w-16 h-16 rounded-full mr-4"
                            />
                        )}
                        <View>
                            <Text className="font-JakartaBold text-lg">{selectedPatient.name}</Text>
                            <View className="flex-row items-center mt-1">
                                <Text className="font-Jakarta text-gray-600 text-sm">Age: {selectedPatient.age}</Text>
                                <Text className="font-Jakarta text-gray-600 text-sm ml-3">Gender: {selectedPatient.gender}</Text>
                            </View>
                            {selectedPatient.blood_group && (
                                <View className="bg-red-100 px-2 py-1 rounded-full mt-1 self-start">
                                    <Text className="font-JakartaMedium text-xs text-red-700">{selectedPatient.blood_group}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Records list */}
                {isLoadingHistory ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text className="font-Jakarta text-gray-500 mt-2">Loading medical records...</Text>
                    </View>
                ) : historyError ? (
                    <View className="flex-1 justify-center items-center">
                        <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
                        <Text className="font-JakartaBold text-lg text-gray-600 mt-2">{historyError}</Text>
                        <TouchableOpacity
                            className="mt-4 bg-blue-100 px-4 py-2 rounded-lg"
                            onPress={() => fetchPatientHistory(selectedPatient.id)}
                        >
                            <Text className="font-JakartaMedium text-blue-700">Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : patientHistory.length > 0 ? (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="font-JakartaBold text-base mb-3">Medical Records</Text>
                        {patientHistory.map((record, index) => (
                            <HistoryRecordCard key={index} record={record} />
                        ))}
                        <View className="h-4" /> {/* Bottom spacing */}
                    </ScrollView>
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <FontAwesome5 name="file-medical-alt" size={60} color="#ccc" />
                        <Text className="font-JakartaBold text-lg text-gray-400 mt-3">No medical records found</Text>
                        <Text className="font-Jakarta text-gray-500 mt-1 text-center px-8">
                            This patient doesn't have any medical records in the system yet.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Main render function
    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View className="flex-1 px-4 pt-2">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity
                        onPress={() => {
                            if (viewMode === "history") {
                                setViewMode("appointments");
                            } else {
                                router.back();
                            }
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text className="font-JakartaBold text-xl">
                        {viewMode === "appointments" ? "Patient Records" :
                            selectedPatient ? `${selectedPatient.name}'s History` : "Patient History"}
                    </Text>
                    <View style={{ width: 24 }} /> {/* Empty view for centering title */}
                </View>

                {viewMode === "appointments" ? (
                    <>
                        {/* Search Bar */}
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
                            <Ionicons name="search" size={20} color="#666" />
                            <TextInput
                                className="flex-1 ml-2 font-Jakarta text-base"
                                placeholder="Search patients, status or symptoms"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Tab Selector */}
                        <View className="flex-row border-b border-gray-200 mb-3">
                            <TouchableOpacity
                                className={`flex-1 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500' : ''}`}
                                onPress={() => setActiveTab('pending')}
                            >
                                <Text className={`text-center font-JakartaBold ${activeTab === 'pending' ? 'text-blue-500' : 'text-gray-500'}`}>
                                    Pending
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500' : ''}`}
                                onPress={() => setActiveTab('history')}
                            >
                                <Text className={`text-center font-JakartaBold ${activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'}`}>
                                    History
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#0066cc" />
                                <Text className="font-Jakarta text-gray-500 mt-2">Loading appointments...</Text>
                            </View>
                        ) : error ? (
                            <View className="flex-1 justify-center items-center">
                                <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
                                <Text className="font-JakartaBold text-lg text-gray-600 mt-2">Failed to load appointments</Text>
                                <Text className="font-Jakarta text-gray-500 mt-1">Please try again later</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeTab === 'pending' ? (
                                    filteredPending.length > 0 ? (
                                        filteredPending.map((appointment, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => handleAppointmentPress(appointment)}
                                            >
                                                {renderAppointmentCard(appointment)}
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View className="py-10 items-center">
                                            <MaterialIcons name="event-busy" size={60} color="#ccc" />
                                            <Text className="font-JakartaBold text-lg text-gray-400 mt-2">
                                                {searchQuery ? "No matching appointments" : "No pending appointments"}
                                            </Text>
                                        </View>
                                    )
                                ) : (
                                    filteredHistory.length > 0 ? (
                                        filteredHistory.map((appointment, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => handleAppointmentPress(appointment)}
                                            >
                                                {renderAppointmentCard(appointment)}
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View className="py-10 items-center">
                                            <MaterialIcons name="history" size={60} color="#ccc" />
                                            <Text className="font-JakartaBold text-lg text-gray-400 mt-2">
                                                {searchQuery ? "No matching records" : "No appointment history"}
                                            </Text>
                                        </View>
                                    )
                                )}
                                <View className="h-4" /> {/* Bottom spacing */}
                            </ScrollView>
                        )}
                    </>
                ) : renderPatientHistory()}
            </View>

            {/* Modal for appointment details */}
            <AppointmentDetailsModal />

            <StatusBar style="dark" />
        </SafeAreaView>
    );
};

export default PatientRecordScreen;
