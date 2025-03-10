import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Patient } from "@/types/type";

// Add this new function to get patient by ID
export const usePatientById = (id: string) => {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/patient/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Add this new function to get multiple patients by ID
export const usePatientsByIds = (patientIds: string[]) => {
  return useQuery({
    queryKey: ["patientsId", patientIds],
    queryFn: async () => {
      const response = await axios({
        method: "POST",
        data: { patientIds },
        url: `${process.env.EXPO_PUBLIC_BASE_URL}/v1/patients/bulk`,
      });
      return response.data;
    },
    enabled: patientIds.length > 0,
  });
};

export const usePatient = (patientId: string, wallet_address: string) => {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/patients/${patientId}`;
      try {
        const response = await axios({
          method: "get",
          url: apiUrl,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${wallet_address}`,
          },
          timeout: 10000, // 10 second timeout
        });
        return response.data;
      } catch (error: any) {
        if (error.code === "ECONNABORTED") {
          throw new Error(
            "Request timed out. Please check your internet connection."
          );
        }
        if (error.response) {
          console.error(
            "Server responded with:",
            error.response.status,
            error.response.data
          );
          throw new Error(`Server error: ${error.response.status}`);
        }
        if (error.request) {
          console.error("No response received:", error.request);
          throw new Error(
            "No response from server. Please check your internet connection."
          );
        }
        throw error;
      }
    },
    enabled: !!patientId && !!wallet_address,
  });
};
