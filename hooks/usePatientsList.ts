import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Patient } from "@/types/type";

interface PatientsListResponse {
  status: string;
  data: Patient[];
}

export const usePatientsList = (doctorId: string, wallet_address: string) => {
  return useQuery<PatientsListResponse>({
    queryKey: ["doctorPatients", doctorId],
    queryFn: async () => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctors/${doctorId}/patients`;
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
    enabled: !!doctorId && !!wallet_address,
  });
};
