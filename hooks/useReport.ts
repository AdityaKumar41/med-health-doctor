import { ReportSchema } from "@/types/type";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useReportPost = (address: string) => {
    const api = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/report`;
    return useMutation({
        mutationFn: async (report: ReportSchema) => {
            const reponose = await axios({
                method: 'post',
                url: api,
                data: report,
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${address}`
                }
            });
            return reponose.data;
        }
    });
}