import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView, Image
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useAccount } from 'wagmi';
import { useDoctor } from '@/hooks/useDoctor';
import { useTicket } from '@/hooks/useTicket';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';

interface ScannedQrData {
    ticket: string;
    appointment: string;
    timestamp: string;
}

interface TicketData {
    id: string;
    ticket_number: string;
    appointment_id: string;
    status: string;
    notes: string;
    qr_code: string;
    expires_at: string;
    appointment: {
        id: string;
        patient_id: string;
        doctor_id: string;
        date: string;
        status: string;
        appointment_fee: number;
        doctor: {
            id: string;
            name: string;
            profile_picture: string;
            hospital: string;
        };
        patient: {
            id: string;
            name: string;
            email: string;
            gender: string;
            age: number;
            profile_picture: string;
            blood_group: string;
        };
    };
}

const BarcodeScanner = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const navigation = useNavigation();
    const { address } = useAccount();
    const { data: doctorData } = useDoctor(address!);
    const { data: ticketData, isLoading: isLoadingTicket, error: ticketError } =
        useTicket(ticketId || '');

    // Set navigation options
    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Handle barcode scan
    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (scanned) return;

        const { data } = result;
        processScannedData(data);
    };

    const processScannedData = async (data: string) => {
        try {
            setScanned(true);
            setIsVerifying(true);

            // Parse the QR code data
            let parsedData: ScannedQrData;

            try {
                parsedData = JSON.parse(data);

                if (!parsedData.ticket || !parsedData.appointment) {
                    throw new Error('Invalid ticket format');
                }

                // Set ticket ID to trigger data fetching
                setTicketId(parsedData.ticket);

            } catch (error) {
                console.error('Failed to parse QR data:', error);
                setIsValid(false);
                setIsVerifying(false);
                Alert.alert('Invalid QR Code', 'This QR code is not a valid appointment ticket.');
                return;
            }

        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Error', 'Failed to process the scanned code.');
            setIsVerifying(false);
            setIsValid(false);
        }
    };

    // Check ticket validity when ticket data is loaded
    useEffect(() => {
        if (ticketData && !isLoadingTicket) {
            setIsVerifying(false);

            const ticket = ticketData.data;

            // Check if the ticket has valid appointment data before accessing properties
            if (!ticket || !ticket.appointment) {
                setIsValid(false);
                return;
            }

            // Check if ticket is valid and not expired
            const isExpired = new Date(ticket.expires_at) < new Date();
            const isDoctorMatch = ticket.appointment.doctor_id === doctorData?.data?.id;
            const isUsable = ticket.status === "scheduled" || ticket.status === "pending";

            // Check if there are other active appointments for this patient
            const otherAppointments = doctorData?.data?.appointments?.filter(
                (appt: any) =>
                    appt.patient_id === ticket.appointment.patient_id &&
                    appt.id !== ticket.appointment_id
            ) || [];

            // Log if multiple appointments exist
            if (otherAppointments.length > 0) {
                console.log(`Patient has ${otherAppointments.length} other appointments`);
            }

            setIsValid(isDoctorMatch && isUsable && !isExpired);
        }
    }, [ticketData, isLoadingTicket, doctorData]);

    // Handle proceeding with a valid ticket
    const handleProceedWithPatient = () => {
        if (!ticketData?.data) return;

        const ticket = ticketData.data;
        const patientId = ticket.appointment.patient_id;
        const appointmentId = ticket.appointment_id;
        const appointmentStatus = ticket.status || 'scheduled';

        // Check for other appointments
        const otherAppointments = doctorData?.data?.appointments?.filter(
            (appt: any) =>
                appt.patient_id === patientId &&
                appt.id !== appointmentId
        ) || [];

        // Pass appointment status when navigating to the consultation screen
        router.push({
            pathname: '/chating',
            params: {
                patientId,
                patientName: ticket.appointment.patient.name,
                profilePicture: ticket.appointment.patient.profile_picture,
                bloodGroup: ticket.appointment.patient.blood_group,
                appointmentId,
                ticketId: ticket.id,
                appointmentStatus: appointmentStatus,
                hasMultipleAppointments: otherAppointments.length > 0 ? 'true' : 'false'
            }
        });
    };

    // Reset the scanner to scan again
    const handleScanAgain = () => {
        setScanned(false);
        setTicketId(null);
        setIsValid(null);
    };

    // Format date for display
    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "MMM dd, yyyy 'at' h:mm a");
        } catch (e) {
            return dateString;
        }
    };

    // Handle permission loading
    if (!permission) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#0066CC" />
                <Text className="mt-4 text-gray-600 font-Jakarta">Requesting camera permission...</Text>
            </SafeAreaView>
        );
    }

    // Handle permission denied
    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white p-4">
                <Ionicons name="camera-reverse-outline" size={60} color="#FF3B30" />
                <Text className="mt-4 text-xl font-JakartaBold text-center">Camera Access Denied</Text>
                <Text className="mt-2 text-gray-600 text-center font-Jakarta">
                    Please grant camera permissions to scan patient tickets.
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="mt-6 bg-blue-500 py-3 px-6 rounded-full"
                >
                    <Text className="text-white font-JakartaBold">Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 py-3 px-6 rounded-full"
                >
                    <Text className="text-blue-500 font-JakartaBold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 relative">
                {/* Header */}
                <View className="absolute top-0 left-0 right-0 z-10 p-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-black/30 w-10 h-10 rounded-full flex items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-center text-xl font-JakartaBold mt-2">
                        Scan Patient Ticket
                    </Text>
                </View>

                {/* Camera View */}
                {!scanned && (
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        facing="back"
                    />
                )}

                {/* Scanner overlay with scanning guide */}
                {!scanned && (
                    <View className="flex-1 justify-center items-center">
                        <View className="w-64 h-64 border-2 border-white/70 rounded-lg" />
                        <Text className="text-white mt-6 text-center font-Jakarta px-8">
                            Position the QR code within the square to scan the patient's ticket
                        </Text>
                    </View>
                )}

                {/* Results Panel */}
                {scanned && (
                    <View className="flex-1 justify-center items-center bg-black/95 px-5">
                        {isVerifying || isLoadingTicket ? (
                            <View className="items-center">
                                <ActivityIndicator size="large" color="#0066CC" />
                                <Text className="mt-4 text-white text-xl font-JakartaBold">Verifying Ticket</Text>
                                <Text className="mt-2 text-gray-300 text-center font-Jakarta">
                                    Please wait while we verify the patient ticket...
                                </Text>
                            </View>
                        ) : ticketError || !ticketData?.data || !ticketData.data.appointment ? (
                            <View className="bg-white w-full rounded-xl p-6 items-center">
                                <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="close-circle" size={40} color="#EF4444" />
                                </View>
                                <Text className="text-red-600 text-xl font-JakartaBold">Invalid Ticket</Text>
                                <Text className="text-center text-gray-500 mt-2 font-Jakarta">
                                    The ticket could not be found or contains invalid data.
                                </Text>
                                <TouchableOpacity
                                    onPress={handleScanAgain}
                                    className="mt-6 bg-blue-500 py-3 px-6 rounded-full w-full"
                                >
                                    <Text className="text-white font-JakartaBold text-center">
                                        Scan Another Ticket
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="bg-white w-full rounded-xl p-6 items-center">
                                {isValid ? (
                                    <View className="items-center w-full">
                                        <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                                            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                                        </View>
                                        <Text className="text-green-600 text-xl font-JakartaBold">Valid Ticket</Text>

                                        {/* Ticket Details */}
                                        <View className="w-full mt-6 bg-gray-50 p-4 rounded-xl">
                                            <Text className="font-JakartaBold text-base text-gray-800 mb-2">Ticket Information</Text>

                                            <View className="flex-row justify-between py-1">
                                                <Text className="text-gray-500 font-Jakarta">Ticket Number:</Text>
                                                <Text className="font-JakartaMedium">{ticketData?.data.ticket_number}</Text>
                                            </View>

                                            <View className="flex-row justify-between py-1">
                                                <Text className="text-gray-500 font-Jakarta">Status:</Text>
                                                <Text className="font-JakartaMedium text-blue-600">{ticketData?.data.status.toUpperCase()}</Text>
                                            </View>

                                            <View className="flex-row justify-between py-1">
                                                <Text className="text-gray-500 font-Jakarta">Appointment Date:</Text>
                                                <Text className="font-JakartaMedium">
                                                    {formatDateTime(ticketData?.data.appointment.date || '')}
                                                </Text>
                                            </View>

                                            <View className="flex-row justify-between py-1">
                                                <Text className="text-gray-500 font-Jakarta">Valid Until:</Text>
                                                <Text className="font-JakartaMedium">
                                                    {formatDateTime(ticketData?.data.expires_at || '')}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Patient Information */}
                                        <View className="w-full mt-4 bg-blue-50 p-4 rounded-xl">
                                            <View className="flex-row items-center mb-2">
                                                <Text className="font-JakartaBold text-base text-gray-800">Patient Information</Text>
                                                {ticketData?.data.appointment.patient.blood_group && (
                                                    <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
                                                        <Text className="text-xs font-JakartaMedium text-red-700">
                                                            {ticketData.data.appointment.patient.blood_group}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View className="flex-row items-center mb-2">
                                                {ticketData?.data.appointment.patient.profile_picture && (
                                                    <Image
                                                        source={{ uri: ticketData.data.appointment.patient.profile_picture }}
                                                        className="w-10 h-10 rounded-full mr-3"
                                                    />
                                                )}
                                                <View>
                                                    <Text className="font-JakartaBold">{ticketData?.data.appointment.patient.name}</Text>
                                                    <Text className="font-Jakarta text-gray-500 text-sm">
                                                        {ticketData?.data.appointment.patient.gender}, {ticketData?.data.appointment.patient.age} yrs
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Doctor Info */}
                                        <View className="w-full mt-4 bg-gray-50 p-4 rounded-xl">
                                            <Text className="font-JakartaBold text-sm text-gray-500 mb-1">ASSIGNED DOCTOR</Text>
                                            <View className="flex-row items-center">
                                                {ticketData?.data.appointment.doctor.profile_picture && (
                                                    <Image
                                                        source={{ uri: ticketData?.data.appointment.doctor.profile_picture }}
                                                        className="w-8 h-8 rounded-full mr-2"
                                                    />
                                                )}
                                                <Text className="font-JakartaMedium">{ticketData?.data.appointment.doctor.name}</Text>
                                            </View>
                                        </View>

                                        {/* Show multiple appointments notice if applicable */}
                                        {isValid && doctorData?.data?.appointments?.filter(
                                            (appt: any) => appt.patient_id === ticketData?.data?.appointment.patient_id
                                        ).length > 1 && (
                                                <View className="w-full mt-2 bg-blue-50 p-2 rounded-lg">
                                                    <Text className="font-Jakarta text-blue-600 text-center text-sm">
                                                        Note: This patient has multiple appointments
                                                    </Text>
                                                </View>
                                            )}

                                        <TouchableOpacity
                                            onPress={handleProceedWithPatient}
                                            className="mt-6 bg-blue-500 py-3 px-6 rounded-full w-full"
                                        >
                                            <Text className="text-white font-JakartaBold text-center">Start Consultation</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="items-center">
                                        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                                            <Ionicons name="close-circle" size={40} color="#EF4444" />
                                        </View>
                                        <Text className="text-red-600 text-xl font-JakartaBold">
                                            {ticketData?.data?.status === 'completed' ? 'Appointment Completed' :
                                                ticketData?.data?.status === 'cancelled' ? 'Ticket Cancelled' :
                                                    new Date(ticketData?.data?.expires_at || '') < new Date() ? 'Ticket Expired' :
                                                        ticketData?.data?.appointment?.doctor_id !== doctorData?.data?.id ? 'Wrong Doctor' :
                                                            'Invalid Ticket'}
                                        </Text>
                                        <Text className="text-center text-gray-500 mt-2 font-Jakarta">
                                            {ticketData?.data?.status === 'completed' ? 'This appointment has already been completed.' :
                                                ticketData?.data?.status === 'cancelled' ? 'This ticket has been cancelled.' :
                                                    new Date(ticketData?.data?.expires_at || '') < new Date() ? 'This ticket has expired.' :
                                                        ticketData?.data?.appointment.doctor_id !== doctorData?.data?.id ? 'This ticket is for another doctor.' :
                                                            'This ticket is invalid or cannot be verified.'}
                                        </Text>

                                        {/* Show ticket details even if invalid */}
                                        {ticketData?.data && ticketData.data.appointment && (
                                            <View className="w-full mt-4 bg-gray-50 p-3 rounded-lg">
                                                <Text className="font-JakartaBold text-sm mb-1">Ticket Details</Text>
                                                <Text className="font-Jakarta text-gray-600 text-sm">
                                                    {ticketData.data.ticket_number} • {ticketData.data.status}
                                                </Text>
                                                <Text className="font-Jakarta text-gray-600 text-sm mt-1">
                                                    Patient: {ticketData.data.appointment.patient.name}
                                                </Text>
                                                <Text className="font-Jakarta text-gray-600 text-sm">
                                                    Appointment: {formatDateTime(ticketData.data.appointment.date)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={handleScanAgain}
                                    className={`mt-6 ${isValid ? 'bg-gray-100' : 'bg-blue-500'} py-3 px-6 rounded-full w-full`}
                                >
                                    <Text className={`${isValid ? 'text-blue-500' : 'text-white'} font-JakartaBold text-center`}>
                                        Scan Another Ticket
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
            <StatusBar style='light' />
        </SafeAreaView>
    );
};

export default BarcodeScanner;
