import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface PatientData {
    name: string;
    email: string;
    age: number;
    gender: string;
    wallet_address: string;
    blood_group: string;
}

export const usePatientPost = (wallet_address: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (patient: PatientData) => {
            const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/patient`;
            try {
                const response = await axios({
                    method: 'post',
                    url: apiUrl,
                    data: patient,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        Authorization: `Bearer ${wallet_address}`,
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
            queryClient.invalidateQueries({ queryKey: ['patientquery'] });
        }
    });
}

export const usePatient = (address: string) => {
    return useQuery({
        queryKey: ['patientquery'],
        queryFn: async () => {
            const responose = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/v1/patient`, {
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