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