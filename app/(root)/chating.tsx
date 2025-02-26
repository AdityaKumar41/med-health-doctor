import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useChat } from '@/context/ChatContext';
import { router, useNavigation } from 'expo-router';
import { Image } from 'react-native';
import { format } from 'date-fns';

interface Message {
    sender: string;
    message: string;
    timestamp: Date;
}

const ChatRoom = () => {

    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const { socket, sendMessage } = useChat();
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join', socket.id);

        socket.on('receive-message', (message: Message) => {
            setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket]);

    const handleSend = () => {
        if (!newMessage.trim() || !socket) return;

        const message: Message = {
            sender: socket.id || '',
            message: newMessage,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, message]);
        sendMessage('receiver_id', newMessage);
        setNewMessage('');
    };

    const formatMessageTime = (date: Date) => {
        return format(new Date(date), 'h:mm a');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Image
                    source={{ uri: "https://api.dicebear.com/7.x/avataaars/png?seed=DoctorStone" }}
                    className="w-10 h-10 rounded-full ml-4"
                />
                <View className="ml-3">
                    <Text className="font-JakartaBold text-lg">Dr. Stone Gaze</Text>
                    <Text className="font-Jakarta text-xs text-gray-500">Online</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-4"
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg, index) => (
                        <View
                            key={index}
                            className={`flex mb-4 mt-2 ${msg.sender === socket?.id ? 'items-end' : 'items-start'}`}
                        >
                            <View
                                className={`max-w-[80%] ${msg.sender === socket?.id
                                    ? 'bg-blue-500 rounded-t-2xl rounded-bl-2xl'
                                    : 'bg-gray-100 rounded-t-2xl rounded-br-2xl'
                                    } px-4 py-3`}
                            >
                                <Text className={msg.sender === socket?.id ? 'text-white' : 'text-black'}>
                                    {msg.message}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">
                                {formatMessageTime(msg.timestamp)}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                <View className="p-4 border-t border-gray-100 bg-white">
                    <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2">
                        <TextInput
                            className="flex-1 font-Jakarta"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type your message..."
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!newMessage.trim()}
                            className={`ml-2 ${!newMessage.trim() ? 'opacity-50' : ''}`}
                        >
                            <Ionicons name="send" size={24} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatRoom;
