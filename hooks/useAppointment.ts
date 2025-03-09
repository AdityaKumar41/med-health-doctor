import { status } from "@/types/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useAppointment = (wallet_address: string) => {
  return useQuery({
    queryKey: ["appointmentquery"],
    queryFn: async () => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/appointments/doctor`;
      try {
        const response = await axios({
          method: "get",
          url: apiUrl,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${wallet_address}`,
          },
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
  });
};

// approve appointment
export const useAppointmentApprove = (wallet_address: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["appointmentApprove"],
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: status;
    }) => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/${appointmentId}/status`;
      try {
        const response = await axios({
          method: "patch",
          url: apiUrl,
          data: { status },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${wallet_address}`,
          },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentquery", "appointmentPending"] });
    },
  });
};

// Create a new hook for completing appointments
export const useAppointmentComplete = (address: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: string;
    }) => {
      const response = await axios({
        method: "patch",
        url: `${process.env.EXPO_PUBLIC_BASE_URL}/v1/${appointmentId}/status`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
        data: {
          status,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      // Invalidate appointments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
};


export const useAppointmentPending = (wallet_address: string) => {
  return useQuery({
    queryKey: ["appointmentPending"],
    queryFn: async () => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/appointments/pending`;
      try {
        const response = await axios({
          method: "get",
          url: apiUrl,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${wallet_address}`,
          },
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
  });
}