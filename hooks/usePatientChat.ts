import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  file_url?: string;
  file_type?: string;
  read: boolean;
  created_at: string;
}

interface ChatHistory {
  messages: Message[];
  unreadCount: number;
}

export const usePatientChat = (
  patientId: string,
  doctorId: string,
  wallet_address: string
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, sendMessage, isConnected } = useChat();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory, refetch } = useQuery({
    queryKey: ["chatHistory", doctorId, patientId],
    queryFn: async () => {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/messages/history`;
      try {
        setIsLoading(true);
        const response = await axios({
          method: "post",
          url: apiUrl,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${wallet_address}`,
          },
          data: {
            sender_id: doctorId,
            receiver_id: patientId,
          },
        });
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch chat history:", error);
        setError("Failed to load chat history");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!doctorId && !!patientId && !!wallet_address,
  });

  // Initialize messages from chat history
  useEffect(() => {
    if (chatHistory?.messages?.length > 0) {
      setMessages(chatHistory.messages);
    }
  }, [chatHistory]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !patientId || !doctorId) return;

    const handleNewMessage = (newMessage: any) => {
      // Check if the message is part of this conversation
      if (
        (newMessage.sender === patientId && newMessage.receiver === doctorId) ||
        (newMessage.sender === doctorId && newMessage.receiver === patientId)
      ) {
        // Format message to match our Message interface
        const formattedMessage: Message = {
          id: newMessage.id || `temp-${Date.now()}`,
          sender_id: newMessage.sender,
          receiver_id: newMessage.receiver,
          message: newMessage.message,
          file_url: newMessage.file_url,
          file_type: newMessage.file_type,
          read: false,
          created_at: new Date(newMessage.timestamp).toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, formattedMessage]);

        // Mark message as read if sent by patient
        if (newMessage.sender === patientId) {
          markAsRead(formattedMessage.id);
        }
      }
    };

    socket.on("private-message", handleNewMessage);

    return () => {
      socket.off("private-message", handleNewMessage);
    };
  }, [socket, patientId, doctorId]);

  // Send message function
  const sendChatMessage = useCallback(
    (message: string, file_url?: string, file_type?: string) => {
      if (!patientId || !isConnected) {
        setError("Cannot send message. Please check your connection.");
        return null;
      }

      const sentMessage = sendMessage(patientId, message, file_url, file_type);

      if (sentMessage) {
        // Add to local state immediately for UI feedback
        const localMessage: Message = {
          id: `local-${Date.now()}`,
          sender_id: doctorId,
          receiver_id: patientId,
          message,
          file_url,
          file_type,
          read: false,
          created_at: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, localMessage]);
        return localMessage;
      }

      return null;
    },
    [patientId, doctorId, isConnected, sendMessage]
  );

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/messages/read/${messageId}`;
      await axios({
        method: "put",
        url: apiUrl,
        headers: {
          Authorization: `Bearer ${wallet_address}`,
        },
      });

      // Update cached data
      queryClient.invalidateQueries(["chatHistory", doctorId, patientId]);
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  // Mark all messages as read
  const markAllAsRead = async () => {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/v1/messages/read-all`;
      await axios({
        method: "put",
        url: apiUrl,
        headers: {
          Authorization: `Bearer ${wallet_address}`,
        },
        data: {
          sender_id: patientId,
          receiver_id: doctorId,
        },
      });

      // Update cached data
      queryClient.invalidateQueries(["chatHistory", doctorId, patientId]);
    } catch (error) {
      console.error("Failed to mark all messages as read:", error);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendChatMessage,
    markAsRead,
    markAllAsRead,
    refetchHistory: refetch,
    isConnected,
  };
};
