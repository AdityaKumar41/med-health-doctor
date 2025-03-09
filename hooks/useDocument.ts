import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useDocumentPost = (wallet_address: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (document) => {
            const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/document`;
            try {
                const response = await axios({
                    method: 'post',
                    url: apiUrl,
                    data: document,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        Authorization: `Bearer ${wallet_address}`,
                    },
                });

                return response.data;
            } catch (error: any) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                if (error.response) {

                    throw new Error(`Server error: ${error.response.status}`);
                }
                if (error.request) {

                    throw new Error('No response from server. Please check your internet connection.');
                }
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patientquery'] });
        }
    });
};


export const useDocument = (wallet_address: string) => {
    return useQuery({
        queryKey: ['document'],
        queryFn: async () => {
            const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/document`;
            try {
                const response = await axios({
                    method: 'get',
                    url: apiUrl,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        Authorization: `Bearer ${wallet_address}`,
                    },
                });
                return response.data;
            } catch (error: any) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                if (error.response) {
                    throw new Error(`Server error: ${error.response.status}`);
                }
                if (error.request) {
                    throw new Error('No response from server. Please check your internet connection.');
                }
                throw error;
            }
        }
    });
};