import { usePatient } from '@/hooks/usePatient';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAccount } from 'wagmi';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useDoctor } from '@/hooks/useDoctor';

// Setup notifications configuration
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

interface ChatMessage {
    sender: string;
    receiver: string;
    message: string;
    file_url?: string;
    file_type?: string;
    timestamp?: Date; // Add timestamp field to ensure real-time updates
    sender_name?: string; // Add this for notifications
    sender_id?: string;   // Add this to match backend expectations
    patient_id?: string; // Add new field for patient identification
}

interface ChatContextType {
    socket: Socket | null;
    sendMessage: (receiverId: string, message: string, file_url?: string, file_type?: string) => void;
    onlineUsers: Set<string>;
    setUserOnline: (userId: string) => void;
    setUserOffline: (userId: string) => void;
    activeChat: string | null; // Track active chat
    setActiveChat: (chatId: string | null) => void;
    requestNotificationPermissions: () => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType>({
    socket: null,
    sendMessage: () => { },
    onlineUsers: new Set(),
    setUserOnline: () => { },
    setUserOffline: () => { },
    activeChat: null,
    setActiveChat: () => { },
    requestNotificationPermissions: async () => false,
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

    const { address } = useAccount();
    const { data: doctor } = useDoctor(address!);
    const socketInitialized = useRef(false);
    const lastNotificationTime = useRef<Record<string, number>>({});

    // Request notification permissions
    const requestNotificationPermissions = async () => {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('chat-messages', {
                    name: 'Chat Messages',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#0066CC',
                });
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            const granted = finalStatus === 'granted';
            setHasNotificationPermission(granted);
            return granted;
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    };

    // Request permissions on mount
    useEffect(() => {
        requestNotificationPermissions();
    }, []);

    // Configure notification handling
    useEffect(() => {
        // Handle notification responses (when user taps notification)
        interface NotificationData {
            senderId: string;
            senderName: string;
        }

        const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
            const data = response.notification.request.content.data as NotificationData;

            // Navigate to chat with this sender when notification is tapped
            if (data.senderId) {
                // Set as active chat when notification is tapped
                setActiveChat(data.senderId);
                console.log('Notification tapped, setting active chat:', data.senderId);
            }
        });

        return () => notificationSubscription.remove();
    }, []);

    useEffect(() => {
        // Prevent multiple socket connections
        if (socketInitialized.current) return;

        try {
            const newSocket = io(process.env.EXPO_PUBLIC_SOCKET_URL!);

            newSocket.on('connect', () => {
                console.log('Socket connected successfully');
                // Emit user connected event when socket connects
                if (doctor?.id) {
                    newSocket.emit('user-connected', { userId: doctor.id });
                }
            });

            // Listen for online users updates
            newSocket.on('online-users', (users: string[]) => {
                setOnlineUsers(new Set(users));
            });

            // Listen for user connected events
            newSocket.on('user-connected', (userId: string) => {
                setOnlineUsers(prev => new Set([...prev, userId]));
            });

            // Listen for user disconnected events
            newSocket.on('user-disconnected', (userId: string) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            });

            // Listen for private messages and show notifications if not in active chat
            newSocket.on('private-message', async (message: ChatMessage) => {
                // Only show notification if:
                // 1. Message is received by current doctor
                // 2. We're not actively chatting with the sender
                // 3. We have notification permission
                if (
                    doctor?.id &&
                    message.receiver === doctor.id &&
                    message.sender !== activeChat &&
                    hasNotificationPermission
                ) {
                    // Throttle notifications from the same sender (max 1 per second)
                    const currentTime = Date.now();
                    const lastTime = lastNotificationTime.current[message.sender] || 0;

                    if (currentTime - lastTime < 1000) {
                        console.log("Throttling notification");
                        return;
                    }

                    lastNotificationTime.current[message.sender] = currentTime;

                    const senderName = message.sender_name || 'Patient';
                    const notificationTitle = `New message from ${senderName}`;

                    // Format notification body based on message type
                    let notificationBody = message.message;
                    if (message.file_url) {
                        if (message.file_type?.includes('image')) {
                            notificationBody = '📷 Sent you an image';
                        } else if (message.file_type?.includes('pdf')) {
                            notificationBody = '📄 Sent you a document';
                        } else {
                            notificationBody = '📎 Sent you a file';
                        }
                    }

                    // Show notification
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: notificationTitle,
                            body: notificationBody,
                            data: {
                                senderId: message.sender,
                                senderName: senderName,
                            },
                        },
                        trigger: null, // null means show immediately
                    });
                }
            });

            setSocket(newSocket);
            socketInitialized.current = true;

            return () => {
                if (doctor?.id) {
                    newSocket.emit('user-disconnected', { userId: doctor.id });
                }
                newSocket.close();
                socketInitialized.current = false;
            };
        } catch (error) {
            console.error('Socket initialization error:', error);
        }
    }, [doctor?.id, activeChat, hasNotificationPermission]);

    // Debug logging for active chat changes
    useEffect(() => {
        console.log("Active chat changed:", activeChat);
    }, [activeChat]);

    const setUserOnline = (userId: string) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const setUserOffline = (userId: string) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };

    const sendMessage = (receiverId: string, message: string, file_url?: string, file_type?: string) => {
        if (!socket || !doctor?.id) {
            console.error('Socket or doctor ID not available');
            return;
        }

        // Make sure we have a clear file type if there's a file URL
        let finalFileType = file_type;

        if (file_url) {
            // If no file type provided, try to determine from content
            if (!finalFileType) {
                // Check URL for image patterns
                if (file_url.match(/\.(jpg|jpeg|png|gif)($|\?)/i)) {
                    // Be explicit about the type
                    finalFileType = 'image';
                }
                // Check URL for PDF patterns
                else if (file_url.match(/\.pdf($|\?)/i)) {
                    finalFileType = 'application/pdf';
                }
                // Check message for hints
                else if (message.includes('📷') || message.toLowerCase().includes('image')) {
                    finalFileType = 'image';
                }
                else if (message.includes('📄') || message.toLowerCase().includes('document')) {
                    finalFileType = 'application/pdf';
                }
            }

            // Extra sanity check: if we have specific strings, normalize them
            if (finalFileType) {
                const lowerType = finalFileType.toLowerCase();
                if (lowerType === 'image/jpeg' || lowerType === 'image/png' ||
                    lowerType === 'image/gif' || lowerType.includes('jpg') ||
                    lowerType.includes('jpeg') || lowerType.includes('png')) {
                    // Force simple "image" type to ensure consistent handling
                    finalFileType = 'image';
                }
                else if (lowerType === 'application/pdf' || lowerType.includes('pdf')) {
                    finalFileType = 'application/pdf';
                }
            }
        }

        const chatMessage: ChatMessage = {
            sender: doctor.id,
            sender_id: doctor.id,
            receiver: receiverId,
            message,
            timestamp: new Date(),
            file_url,
            file_type: finalFileType,
            sender_name: doctor.name,
        };

        try {
            // Log what we're actually sending
            console.log('Sending message with file info:', {
                hasFile: !!file_url,
                fileUrl: file_url,
                fileType: finalFileType
            });

            socket.emit('private-message', chatMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <ChatContext.Provider value={{
            socket,
            sendMessage,
            onlineUsers,
            setUserOnline,
            setUserOffline,
            activeChat,
            setActiveChat,
            requestNotificationPermissions
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
