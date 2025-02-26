import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export const useAws = (address: String) => {
    return useQuery({
        queryKey: ['aws-query'],
        queryFn: async () => {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/aws`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${address}`,
                },
            });
            return response.data;
        }
    })
}