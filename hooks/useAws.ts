import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface SignedUrlParams {
    filename: string;
    filetype: string;
}

interface SignedUrlResponse {
    signedUrl: string;
    success: boolean;
}

export const useSignedUrl = (address: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;

    return useMutation({
        mutationFn: async ({ filename, filetype }: SignedUrlParams) => {
            console.log('Requesting signed URL with:', {
                baseUrl,
                filename,
                filetype,
                address
            });

            try {
                const response = await axios({
                    method: 'POST',
                    url: `${baseUrl}/aws/signedurl`,
                    headers: {
                        'Authorization': `Bearer ${address}`,
                        'Content-Type': 'application/json',
                    },
                    data: {
                        filename,
                        filetype
                    }
                });

                console.log('SignedURL Response:', response.data);

                if (!response.data?.signedUrl || !response.data?.success) {
                    throw new Error('Invalid response format from server');
                }

                // Extract the key from the signedUrl
                const urlParts = response.data.signedUrl.split('?')[0];
                const key = urlParts.split('.com/')[1];

                return {
                    url: response.data.signedUrl,
                    key: key
                };
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('SignedURL API Error:', {
                        status: error.response?.status,
                        data: error.response?.data,
                        config: error.config
                    });
                    throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
                }
                throw error;
            }
        }
    });
};
