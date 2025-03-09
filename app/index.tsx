import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAccount } from "wagmi";
import { useDoctor } from "@/hooks/useDoctor";

// root index page where we check if the user is a patient or not
// if the user is a patient, we redirect them to the home page

const IndexPage = () => {
    const { address } = useAccount();
    const { data, isLoading } = useDoctor(address!);

    console.log("User address:", address);

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0066cc" />
                <Text className="mt-2 text-gray-600">Loading your information...</Text>
            </View>
        );
    }

    if (data) {
        return <Redirect href={"/(root)/(tabs)"} />;
    }

    // If we have appointment data and user is a doctor
    // if (appointmentData?.data?.length > 0) {
    //     return <Redirect href={"/(root)/patient-record"} />;
    // }

    return <Redirect href={"/(auth)/welcome"} />;
};

export default IndexPage;
