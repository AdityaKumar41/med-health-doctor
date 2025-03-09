import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/v1/ticket/${ticketId}`
      );

      return response.data;
    },
    enabled: !!ticketId, // Only run when ticketId is provided
  });
};

// New mutation to resolve a ticket
export const useTicketResolve = (address: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      const response = await axios({
        method: "PATCH",
        url: `${process.env.EXPO_PUBLIC_BASE_URL}/v1/ticket/${ticketId}/resolve`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
      });

      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific ticket query to refresh its data
      queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
    },
  });
};
