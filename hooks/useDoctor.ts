import { FormDataRedg } from "@/types/type";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";

export const useDoctorPost = (address: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doctor: FormDataRedg) => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor`;
      try {
        const response = await axios({
          method: "post",
          url: apiUrl,
          data: doctor,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${address}`,
          },
        });

        console.log("API Response:", response);
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
      queryClient.invalidateQueries({ queryKey: ["doctorquery"] });
    },
  });
};

// get doctor by id
export const useDoctorbyId = (id: string) => {
  return useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor/${id}`
      );
      return response.data;
    },
  });
};

// get doctor by wallet address
export const useDoctor = (address: string) => {
  return useQuery({
    queryKey: ["doctorquery", address],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${address}`,
          },
        }
      );
      return response.data?.data;
    },
    enabled: !!address,
  });
};

export const useDoctorUpdate = (address: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doctor: FormDataRedg) => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor`;
      try {
        const response = await axios({
          method: "patch",
          url: apiUrl,
          data: doctor,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${address}`,
          },
        });

        console.log("API Response:", response);
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
      queryClient.invalidateQueries({ queryKey: ["doctorquery"] });
    },
  });
};

// query for search doctor
export const useSearchDoctor = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  console.log("useSearchDoctor called with query:", debouncedQuery);
  return useQuery({
    queryKey: ["doctor", "search", debouncedQuery],
    queryFn: async () => {
      console.log("Fetching search results for query:", debouncedQuery);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor/search?query=${debouncedQuery}`
      );
      return response.data;
    },
    enabled: !!debouncedQuery, // Ensure the query is only run when there is a search query
  });
};

// get all doctors by id
export const useDoctorsByIds = (doctorIds: string[]) => {
  return useQuery({
    queryKey: ["doctorsId", doctorIds],
    queryFn: async () => {
      const responose = await axios({
        method: "POST",
        data: { doctorIds },
        url: `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctors/bulk`,
      });
      return responose.data;
    },
  });
};

export const useGetAllDoctors = () => {
  return useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctors`
      );
      return response.data;
    },
  });
};
