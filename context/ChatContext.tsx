import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatContextType {
    socket: Socket | null;
    sendMessage: (receiverId: string, message: string) => void;
}

const ChatContext = createContext<ChatContextType>({
    socket: null,
    sendMessage: () => { },
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io('http://192.168.116.244:4000');
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const sendMessage = (receiverId: string, message: string) => {
        if (socket) {
            socket.emit('private-message', {
                sender: socket.id,
                receiver: receiverId,
                message,
                timestamp: new Date(),
            });
        }
    };

    return (
        <ChatContext.Provider value={{ socket, sendMessage }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
