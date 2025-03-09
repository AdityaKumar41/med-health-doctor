import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useSpecialization = () => {
    return useQuery({
        queryKey: ['specialization'],
        queryFn: async () => {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/v1/specializations`);

            return response.data;
        }
    })
};


// get all doctor by specializations
export const useDoctorBySpecialization = (specializationId: string) => {
    return useQuery({
        queryKey: ['doctor', specializationId],
        queryFn: async () => {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctors/specialization/${specializationId}`);

            return response.data;
        }
    })
};

// get doctor specialization by doctor id
export const useDoctorSpecialization = (doctorId: string) => {
    return useQuery({
        queryKey: ['doctor-specialization', doctorId],
        queryFn: async () => {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/v1/specialization/${doctorId}`);

            return response.data;
        }
    })
};