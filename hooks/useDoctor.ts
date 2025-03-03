import { FormData } from "@/types/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios";

export const useDoctorPost = (address: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (doctor: FormData) => {
            const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor`;
            try {
                const response = await axios({
                    method: 'post',
                    url: apiUrl,
                    data: doctor,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${address}`,
                    },
                });

                console.log('API Response:', response);
                return response.data;
            } catch (error: any) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                if (error.response) {
                    console.error('Server responded with:', error.response.status, error.response.data);
                    throw new Error(`Server error: ${error.response.status}`);
                }
                if (error.request) {
                    console.error('No response received:', error.request);
                    throw new Error('No response from server. Please check your internet connection.');
                }
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctorquery'] });
        }
    })
}


export const useDoctor = (address: string) => {
    return useQuery({
        queryKey: ['doctorquery'],
        queryFn: async () => {
            const responose = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctor`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${address}`,
                },
            });
            return responose.data;
        }
    })
}

// get all doctors by id
export const useDoctorsByIds = (doctorIds: string[]) => {
    return useQuery({
        queryKey: ["doctorsId", doctorIds],
        queryFn: async () => {
            const responose = await axios({
                method: 'POST',
                data: { doctorIds },
                url: `${process.env.EXPO_PUBLIC_BASE_URL}/v1/doctors/bulk`
            });
            return responose.data;
        }
    });
}