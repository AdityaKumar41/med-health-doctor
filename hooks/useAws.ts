import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface SignedUrlParams {
    filename: string;
    filetype: string;
}

export const useSignedUrl = (address: string) => {
    return useMutation({
        mutationFn: async ({ filename, filetype }: SignedUrlParams) => {

            const response = await axios({
                method: 'POST',
                url: `${process.env.EXPO_PUBLIC_BASE_URL}/aws/signedurl`,
                headers: {
                    'Authorization': `Bearer ${address}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    filename,
                    filetype
                }
            });

            return response.data;
        }
    });
};
