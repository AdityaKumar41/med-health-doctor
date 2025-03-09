import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { WebView } from 'react-native-webview';
import { useChat } from '@/context/ChatContext';
import { router, useNavigation } from 'expo-router';
import { Image } from 'react-native';
import { format } from 'date-fns';
import { usePatient, usePatientById } from '@/hooks/usePatient';
import { useAccount } from 'wagmi';
import { useLocalSearchParams } from 'expo-router';
import { useDoctor, useDoctorbyId } from '@/hooks/useDoctor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignedUrl } from '@/hooks/useAws';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ReportViewer from '@/components/ReportViewer';
import axios from 'axios';

interface Message {
    receiver: string | string[];
    id?: string;
    sender: string;
    message: string;
    content?: string;
    timestamp: Date;
    sentAt?: Date;
    sender_id?: string;
    fileUrl?: string;
    file_url?: string; // Server-side naming convention
    fileType?: 'image' | 'pdf';
    file_type?: string; // Server-side naming convention
    fileName?: string;
}

const ChatRoom = () => {
    const { address } = useAccount();
    const { data: doctor } = useDoctor(address!);
    const navigation = useNavigation();

    // Get patient details from params
    const {
        patientId,
        patientName,
        profilePicture,
        appointmentStatus,
        appointmentId,
        bloodGroup
    } = useLocalSearchParams();

    // Debug logging to see what status is actually being received
    useEffect(() => {
        console.log("Chat opened with appointment status:", appointmentStatus);
        console.log("Appointment ID:", appointmentId);
        console.log("Patient ID:", patientId);
    }, [appointmentStatus, appointmentId, patientId]);

    // Add state to track multiple appointments
    const [patientAppointments, setPatientAppointments] = useState<Array<any>>([]);

    // Get all appointments for this patient when doctor data is loaded
    useEffect(() => {
        if (doctor?.appointments && patientId) {
            const appointments = doctor.appointments.filter(
                (appt: any) => appt.patient_id === patientId
            );

            if (appointments.length > 1) {
                console.log(`Patient has ${appointments.length} appointments`);
                setPatientAppointments(appointments);
            }
        }
    }, [doctor?.appointments, patientId]);

    // Get chat context with active chat tracking
    const { socket, sendMessage, onlineUsers, activeChat, setActiveChat } = useChat();

    // Check if the chat should be locked (pending, completed or cancelled)
    // Fix: Convert appointmentStatus to lowercase for case-insensitive comparison
    const isChatLocked = () => {
        // Handle string and non-string values appropriately
        if (!appointmentStatus) return false;

        // Use toLowerCase for consistent comparison regardless of casing
        const status = String(appointmentStatus).toLowerCase().trim();

        // Print the normalized status for debugging
        console.log("Normalized status for lock check:", status);

        return status === 'completed' || status === 'pending' || status === 'cancelled';
    };

    // Make sure we're properly using the function
    const chatLocked = isChatLocked();
    console.log("Chat locked state:", chatLocked);

    // Check if chat is active (scheduled)
    const isChatActive = () => {
        if (!appointmentStatus) return true; // Default to active if no status
        const status = String(appointmentStatus).toLowerCase();
        return status === 'scheduled';
    };

    // Get the lock message based on status
    const getLockMessage = () => {
        if (!appointmentStatus) return "";

        const status = String(appointmentStatus).toLowerCase();
        switch (status) {
            case 'completed':
                return "This appointment has been completed. The chat is now in read-only mode.";
            case 'pending':
                return "This appointment is pending approval. Chat will be available once approved.";
            case 'cancelled':
                return "This appointment was cancelled. The chat is now in read-only mode.";
            case 'scheduled':
                return ""; // No message for active chats
            default:
                return `This chat is currently locked (${appointmentStatus}).`;
        }
    };

    // Fetch patient data as a backup, but use params if available
    const { data: patientData, error: patientError, isLoading: isPatientLoading } = usePatientById(patientId as string);

    // Use passed params as the primary source, fall back to fetched data
    const patient = {
        id: patientId as string,
        name: patientName as string || patientData?.name,
        profile_picture: profilePicture as string || patientData?.profile_picture
    };

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        if (patientId) {
            // Mark this chat as active to prevent notifications
            setActiveChat(patientId as string);
            console.log('Setting active chat:', patientId);

            // Clear active chat when component unmounts
            return () => {
                console.log('Clearing active chat');
                setActiveChat(null);
            };
        }
    }, [patientId, setActiveChat]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { mutateAsync: getSignedUrl } = useSignedUrl(address || '');
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerContent, setViewerContent] = useState<{
        fileUrl: string;
        fileType: string;
        title: string;
    } | null>(null);

    // Add a reference to track if this is the initial load
    const isInitialRender = useRef(true);

    // Add skeleton message placeholders for better loading experience
    const skeletonMessages = [
        { isReceived: true },
        { isReceived: false },
        { isReceived: true },
    ];

    // Cache key for storing chat messages
    const getChatCacheKey = () => {
        return `chat_${patientId}_${doctor?.id}`;
    };

    // Load cached messages on initial mount
    useEffect(() => {
        const loadCachedMessages = async () => {
            try {
                const cacheKey = getChatCacheKey();
                const cachedMessages = await AsyncStorage.getItem(cacheKey);

                if (cachedMessages) {
                    const parsedMessages = JSON.parse(cachedMessages);
                    // Transform dates back to Date objects
                    const messagesWithDates = parsedMessages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }));

                    setMessages(messagesWithDates);
                    // Show cached data immediately, reducing perception of loading
                    setIsLoadingHistory(false);
                }
            } catch (error) {
                console.error('Failed to load cached messages:', error);
            }
        };

        loadCachedMessages();
    }, [patientId, doctor?.id]);

    // Add a message tracking ref to prevent duplicates
    const processedMessageIds = useRef(new Set<string>());

    // Socket connection and message handling with caching - UPDATED LOGIC
    useEffect(() => {
        if (!socket || !doctor?.id) {
            console.log("Socket or doctor ID not available yet");
            return;
        }

        console.log("Setting up socket listeners for doctor:", doctor.id, "and patient:", patientId);

        // First, let's handle the loading state
        setIsLoadingHistory(true);

        // Join the room with doctor and patient ID
        socket.emit('join', { patientId: patientId, doctorId: doctor.id });

        // Request previous messages for this specific conversation
        // socket.emit('get-previous-messages', {
        //     patientId: patientId,
        //     doctorId: doctor.id
        // });

        // Set a timeout to ensure we don't show loading state for too long
        const loadingTimeout = setTimeout(() => {
            setIsLoadingHistory(false);
            setInitialLoadComplete(true);
            console.log("Loading timeout hit - setting loading to false");
        }, 3000);

        // Clear previous listeners before setting up new ones
        socket.off('previous-messages');
        socket.off('receive-message');

        // Listen for previous messages
        socket.on('previous-messages', (previousMessages) => {
            console.log("Received previous messages:", previousMessages);
            clearTimeout(loadingTimeout);

            if (previousMessages && Array.isArray(previousMessages) && previousMessages.length > 0) {
                // Transform the message format if needed
                const formattedPreviousMessages = previousMessages.map((msg) => ({
                    id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                    sender: msg.sender_id || msg.sender,
                    receiver: msg.receiver_id || msg.receiver,
                    message: msg.content || msg.message,
                    timestamp: new Date(msg.sentAt || msg.timestamp || Date.now()),
                    fileUrl: msg.file_url,
                    fileType: msg.file_type ? determineFileType(msg.file_type) : undefined,
                    fileName: extractFileName(msg.file_url || "")
                }));

                console.log("Formatted previous messages:", formattedPreviousMessages);

                // Track message IDs to prevent duplicates
                formattedPreviousMessages.forEach(msg => {
                    if (msg.id) processedMessageIds.current.add(msg.id);
                });

                // Update state with the properly formatted messages
                setMessages(formattedPreviousMessages);

                // Cache messages for future use
                try {
                    const cacheKey = getChatCacheKey();
                    AsyncStorage.setItem(cacheKey, JSON.stringify(formattedPreviousMessages));
                } catch (error) {
                    console.error('Failed to cache messages:', error);
                }
            } else {
                console.log("No previous messages found or invalid format");
                setMessages([]);
            }

            setIsLoadingHistory(false);
            setInitialLoadComplete(true);
        });

        // Listen for new messages
        socket.on('receive-message', (message) => {
            console.log("New message received:", message);

            // Skip if we've already processed this message
            if (message.id && processedMessageIds.current.has(message.id)) {
                console.log("Skipping already processed message:", message.id);
                return;
            }

            // IMPORTANT: Only process messages that belong to this conversation
            const isForThisConversation =
                // Doctor -> Patient
                (message.sender === doctor.id && message.receiver === patientId) ||
                // Patient -> Doctor
                (message.sender === patientId && message.receiver === doctor.id);

            console.log(
                "Message routing check:",
                `sender: ${message.sender}, receiver: ${message.receiver}`,
                `patientId: ${patientId}, doctorId: ${doctor.id}`,
                `isForThisConversation: ${isForThisConversation}`
            );

            if (!isForThisConversation) {
                console.log("Ignoring message not for this conversation");
                return;
            }

            // Format the received message
            const newMsg = {
                id: message.id || `msg-${Date.now()}-${Math.random()}`,
                sender: message.sender || message.sender_id,
                receiver: message.receiver || message.receiver_id,
                message: message.message || message.content,
                timestamp: new Date(message.timestamp || message.sentAt || Date.now()),
                fileUrl: message.file_url || message.fileUrl,
                fileType: message.file_type ? determineFileType(message.file_type) : message.fileType,
                fileName: message.fileName || extractFileName(message.file_url || message.fileUrl || '')
            };

            // Mark this message as processed
            if (newMsg.id) {
                processedMessageIds.current.add(newMsg.id);
            }

            // Update state
            setMessages(prev => {
                const updatedMessages = [...prev, newMsg];

                // Cache updated messages
                try {
                    const cacheKey = getChatCacheKey();
                    AsyncStorage.setItem(cacheKey, JSON.stringify(updatedMessages));
                } catch (error) {
                    console.error('Failed to update cached messages:', error);
                }

                return updatedMessages;
            });

            // Auto-scroll to bottom when new message arrives
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        // Cleanup function
        return () => {
            clearTimeout(loadingTimeout);
            socket.off('previous-messages');
            socket.off('receive-message');

            // Leave the chat room
            socket.emit('leave', { patientId: patientId, doctorId: doctor.id });
            console.log("Cleaned up socket listeners");
        };
    }, [socket, patientId, doctor?.id]);

    // Determine if we should show loading skeletons
    const shouldShowLoadingSkeletons = () => {
        // Only show skeletons on first load and if we have no cached messages
        return isLoadingHistory && isInitialRender.current && messages.length === 0;
    };

    // Mark initial render as complete after component mounts
    useEffect(() => {
        isInitialRender.current = false;
    }, []);

    // Modify the handleSend function to ensure messages get sent properly
    const handleSend = () => {
        if (!newMessage.trim() || !socket || !doctor?.id || chatLocked) {
            console.log("Cannot send: Empty message, missing socket/doctor, or chat is locked");
            return;
        }

        console.log("Sending message to patient:", patientId, "Message:", newMessage);

        // Add the message locally to ensure immediate feedback
        const localMessage = {
            id: `local-${Date.now()}-${Math.random()}`,
            sender: doctor.id,
            receiver: patientId as string,
            message: newMessage,
            timestamp: new Date(),
            isSending: true // Add a flag to indicate it's being sent
        };

        setMessages(prev => [...prev, localMessage]);

        // Send the message through socket
        sendMessage(patientId as string, newMessage);

        // Clear the input
        setNewMessage('');

        // Scroll to bottom
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const formatMessageTime = (date: Date) => {
        return format(new Date(date), 'h:mm a');
    };

    // Fix the isSender function to correctly identify messages sent by the doctor
    const isSender = (msgSender: string) => {
        // Check if the message sender is the current doctor
        const isCurrentUser = msgSender === doctor?.id;
        return isCurrentUser;
    };

    // Create a skeleton loading message component
    const MessageSkeleton = ({ isReceived }: { isReceived: boolean }) => (
        <View
            className={`flex mb-4 mt-2 ${!isReceived ? 'items-end' : 'items-start'}`}
        >
            <View
                className={`max-w-[70%] h-10 ${!isReceived
                    ? 'bg-blue-200 rounded-t-2xl rounded-bl-2xl'
                    : 'bg-gray-200 rounded-t-2xl rounded-br-2xl'
                    } px-4 py-3 animate-pulse`}
            />
            <View className="w-12 h-3 mt-1 bg-gray-200 rounded animate-pulse" />
        </View>
    );

    // Handle image selection with improved MIME type handling
    const handlePickImage = async () => {
        if (chatLocked) {
            Alert.alert('Cannot Send Media', `This chat is in read-only mode because the appointment status is ${appointmentStatus}.`);
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageAsset = result.assets[0];

                // Log all metadata received from ImagePicker for debugging
                console.log("ImagePicker result:", {
                    uri: imageAsset.uri,
                    fileName: imageAsset.fileName,
                    mimeType: imageAsset.mimeType,
                    fileSize: imageAsset.fileSize
                });

                // Ensure we have the correct MIME type or derive it from file extension
                const mimeType = imageAsset.mimeType || getMimeTypeFromUri(imageAsset.uri);
                console.log("Using MIME type for image:", mimeType);

                await uploadAndSendFile(
                    imageAsset.uri,
                    imageAsset.fileName || `image_${Date.now()}.${getExtensionFromMimeType(mimeType)}`,
                    mimeType,
                    'image'
                );
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Handle document selection with improved MIME type handling
    const handlePickDocument = async () => {
        if (chatLocked) {
            Alert.alert('Cannot Send Document', `This chat is in read-only mode because the appointment status is ${appointmentStatus}.`);
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const document = result.assets[0];

                // Log all metadata received from DocumentPicker for debugging
                console.log("DocumentPicker result:", {
                    uri: document.uri,
                    name: document.name,
                    mimeType: document.mimeType,
                    size: document.size
                });

                // Always use the MIME type from DocumentPicker if available
                const mimeType = document.mimeType || 'application/pdf';
                console.log("Using MIME type for document:", mimeType);

                await uploadAndSendFile(
                    document.uri,
                    document.name,
                    mimeType,
                    'pdf'
                );
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    // Helper function to determine file type category
    const determineFileType = (fileType: string): 'image' | 'pdf' | undefined => {
        if (!fileType) return undefined;

        const lowerType = fileType.toLowerCase();

        // Check for MIME type patterns first
        if (lowerType.startsWith('image/')) return 'image';
        if (lowerType === 'application/pdf') return 'pdf';

        // Fall back to extension-based checks
        if (lowerType.includes('jpg') || lowerType.includes('jpeg') ||
            lowerType.includes('png') || lowerType.includes('gif')) {
            return 'image';
        } else if (lowerType.includes('pdf')) {
            return 'pdf';
        }

        return undefined;
    };

    // Helper function to extract MIME type from URI based on extension
    const getMimeTypeFromUri = (uri: string): string => {
        // Default to 'application/octet-stream' if we can't determine
        if (!uri) return 'application/octet-stream';

        const extension = uri.split('.').pop()?.toLowerCase() || '';

        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'pdf':
                return 'application/pdf';
            default:
                return 'application/octet-stream';
        }
    };

    // Helper function to get file extension from MIME type
    const getExtensionFromMimeType = (mimeType: string): string => {
        switch (mimeType) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/gif':
                return 'gif';
            case 'application/pdf':
                return 'pdf';
            default:
                return 'bin';
        }
    };

    // Handle Send File function with improved error handling
    const handleSendFile = async (fileUrl: string, fileType: string) => {
        if (!socket) {
            console.error("Socket not available, cannot send file");
            return;
        }

        try {
            // Remove the base URL if it's present to store relative path
            const relativeUrl = fileUrl.replace(`${process.env.EXPO_PUBLIC_AWS_S3_URL || ''}`, '');

            // Get the filename from the URL
            const fileName = extractFileName(fileUrl);

            // Create appropriate message based on file type
            let message = "";
            if (fileType.includes('image')) {
                message = `📷 Image: ${fileName}`;
            } else if (fileType.includes('pdf')) {
                message = `📄 Document: ${fileName}`;
            } else {
                message = `📎 File: ${fileName}`;
            }

            // Send message with the file details
            await sendMessage(
                patientId as string,
                message,
                relativeUrl,
                fileType
            );
        } catch (error) {
            console.error("Error sending file message:", error);
            Alert.alert('Error', 'Failed to send file message. Please try again.');
        }
    };

    // Upload and send file using signed URL with optimized content-type handling
    const uploadAndSendFile = async (fileUri: string, fileName: string, fileType: string, messageType: 'image' | 'pdf') => {
        if (!fileUri) {
            console.error("No file URI provided");
            Alert.alert('Error', 'No file selected');
            return;
        }

        try {
            setIsUploading(true);

            // Ensure we have a valid MIME type - don't rely on derived values
            const mimeType = fileType || getMimeTypeFromUri(fileUri);
            console.log(`Uploading file: ${fileName}, MIME type: ${mimeType}`);

            const response = await getSignedUrl({
                filename: fileName,
                filetype: mimeType
            });

            if (!response || !response.url || !response.key) {
                throw new Error("Failed to get valid signed URL");
            }

            const { url, key } = response;
            console.log(`Got signed URL: ${url}, key: ${key}`);

            // Check if file exists and is accessible
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (!fileInfo.exists) {
                throw new Error("File does not exist at the specified URI");
            }

            // Binary data upload is more reliable for preserving content types
            try {
                // For files, using binary mode is more reliable than base64 for content type handling
                const fileBlob = await FileSystem.readAsStringAsync(fileUri, {
                    encoding: FileSystem.EncodingType.Base64
                });

                // Important: Use the correct content-type header
                console.log("Sending S3 upload with Content-Type:", mimeType);
                const uploadResponse = await axios({
                    method: 'PUT',
                    url,
                    data: fileBlob,
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Encoding': 'base64'
                    },
                    transformRequest: [(data) => data], // Prevent axios from messing with the data
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        console.log(`Upload progress: ${percentCompleted}%`);
                    }
                });

                if (uploadResponse.status >= 200 && uploadResponse.status < 300) {
                    console.log("S3 upload successful with response status:", uploadResponse.status);
                } else {
                    throw new Error(`Upload failed with status: ${uploadResponse.status}`);
                }
            } catch (uploadError) {
                console.error("Axios upload failed:", uploadError);
                console.log("Trying FileSystem.uploadAsync fallback...");

                // Fallback to FileSystem.uploadAsync
                const uploadResult = await FileSystem.uploadAsync(url, fileUri, {
                    httpMethod: 'PUT',
                    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
                    headers: {
                        'Content-Type': mimeType
                    }
                });

                if (uploadResult.status >= 200 && uploadResult.status < 300) {
                    console.log("FileSystem upload successful with status:", uploadResult.status);
                } else {
                    throw new Error(`Upload failed with status: ${uploadResult.status}`);
                }
            }

            // Construct the complete file URL with proper timestamp to prevent caching issues
            const s3BaseUrl = process.env.EXPO_PUBLIC_AWS_S3_URL;
            if (!s3BaseUrl) {
                throw new Error("S3 base URL not configured in environment variables");
            }

            // Add timestamp to force image refresh on the receiving end
            const timestamp = Date.now();
            const fileUrl = `${s3BaseUrl}/${key}?t=${timestamp}`;
            console.log("File URL with timestamp:", fileUrl);

            // Send message with file details - ensure we pass the original mime type
            await handleSendFile(fileUrl, mimeType);

            setIsUploading(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Upload Failed', 'Failed to upload file. Please try again later.');
            setIsUploading(false);
        }
    };

    // Get proper MIME type for file uploads and viewers - enhanced version
    const getMimeType = (fileType: string | undefined): string => {
        if (!fileType) return 'application/octet-stream';

        // If it's already a proper MIME type, return it
        if (fileType.includes('/')) {
            return fileType.toLowerCase();
        }

        const lowerType = fileType.toLowerCase();

        // Generate MIME type based on extension or type hint
        if (lowerType.includes('jpg') || lowerType.includes('jpeg')) {
            return 'image/jpeg';
        } else if (lowerType.includes('png')) {
            return 'image/png';
        } else if (lowerType.includes('gif')) {
            return 'image/gif';
        } else if (lowerType.includes('pdf')) {
            return 'application/pdf';
        } else if (lowerType.includes('image')) {
            return 'image/jpeg'; // Default image type
        }

        return 'application/octet-stream'; // Default binary type
    };

    // Extract filename from URL
    const extractFileName = (url: string | undefined): string => {
        if (!url) return 'Unknown File';

        try {
            // Get the last part of the URL after the last slash
            const parts = decodeURIComponent(url).split('/');
            const fileName = parts[parts.length - 1];

            // Remove query parameters if present
            return fileName.split('?')[0];
        } catch (e) {
            return 'File';
        }
    };

    // Ensure URL is complete with better error handling
    const getFullUrl = (url: string | undefined): string => {
        if (!url) return '';

        try {
            // If it already has the protocol, return as is
            if (url.startsWith('http')) return url;

            const baseUrl = process.env.EXPO_PUBLIC_AWS_S3_URL;
            if (!baseUrl) {
                console.error("S3 base URL not configured in environment variables");
                return url; // Return whatever we have as fallback
            }

            // Make sure there's a single slash between base URL and the path
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            } else {
                return `${baseUrl}/${url}`;
            }
        } catch (error) {
            console.error("Error formatting URL:", error);
            return url || '';
        }
    };

    // Debugging helper function
    const debugMessageContent = (msg: Message) => {
        console.log(`Message debug:
        - Content: ${msg.message || msg.content}
        - File URL: ${msg.fileUrl || msg.file_url || 'none'}
        - File Type: ${msg.fileType || msg.file_type || 'unknown'}
        - File Name: ${msg.fileName || extractFileName(msg.fileUrl || msg.file_url || '')}
        `);
    }

    // Update the message rendering to display images and documents with better MIME type handling
    const renderMessageContent = (msg: Message) => {
        try {
            // Debug message content
            debugMessageContent(msg);

            // Get file URL
            const fileUrl = msg.fileUrl || msg.file_url;
            const message = msg.message || msg.content;

            // If no file URL, it's a regular text message
            if (!fileUrl) {
                return (
                    <Text className={`${isSender(msg.sender || msg.sender_id || '') ? 'text-white' : 'text-black'} font-Jakarta`}>
                        {message || "Empty message"}
                    </Text>
                );
            }

            // Get file type - prioritize the actual MIME type if available
            const fileTypeStr = msg.file_type || '';
            const fileCategory = determineFileType(fileTypeStr);

            // Get full URL and filename
            // Add a timestamp to the URL to prevent caching if there isn't one already
            const baseUrl = getFullUrl(fileUrl);
            const fullUrl = baseUrl.includes('?') ? baseUrl : `${baseUrl}?t=${Date.now()}`;
            const fileName = msg.fileName || extractFileName(fileUrl);
            const mimeType = getMimeType(fileTypeStr);

            console.log(`Rendering file message: 
            - URL: ${fullUrl}
            - Type: ${fileCategory} (${mimeType})
            - Name: ${fileName}`
            );

            // Handle image files with proper MIME type
            if (fileCategory === 'image') {
                return (
                    <View>
                        <TouchableOpacity
                            onPress={() => {
                                console.log("Opening image viewer with MIME type:", mimeType);
                                setViewerContent({
                                    fileUrl: fullUrl,
                                    fileType: mimeType,
                                    title: fileName
                                });
                                setViewerVisible(true);
                            }}
                        >
                            <Image
                                source={{ uri: fullUrl }}
                                className="w-[200px] h-[150px] rounded-lg mb-1"
                                resizeMode="cover"
                                onError={(error) => {
                                    console.error('Image loading error:', error.nativeEvent.error);
                                    console.log('Failed image URL:', fullUrl);
                                }}
                                // Add cache busting for newer React Native versions
                                key={`img-${fullUrl}`}
                            />
                            <Text
                                className={`text-xs ${isSender(msg.sender || msg.sender_id || '') ? 'text-white' : 'text-black'}`}
                                numberOfLines={1}
                            >
                                {fileName}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }
            // Handle PDF files
            else if (fileCategory === 'pdf') {
                return (
                    <TouchableOpacity
                        className="flex-row items-center bg-opacity-30 bg-gray-200 p-2 rounded-lg"
                        style={{ backgroundColor: isSender(msg.sender || msg.sender_id || '') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                        onPress={() => {
                            console.log("Opening PDF viewer:", fullUrl);
                            setViewerContent({
                                fileUrl: fullUrl,
                                fileType: 'application/pdf',
                                title: fileName
                            });
                            setViewerVisible(true);
                        }}
                    >
                        <Ionicons
                            name="document-text"
                            size={32}
                            color={isSender(msg.sender || msg.sender_id || '') ? "#ffffff" : "#f40f02"}
                        />
                        <View className="flex-1 ml-2">
                            <Text
                                className={`${isSender(msg.sender || msg.sender_id || '') ? 'text-white' : 'text-black'} font-JakartaSemiBold`}
                                numberOfLines={1}
                            >
                                {fileName}
                            </Text>
                            <Text
                                className={`text-xs ${isSender(msg.sender || msg.sender_id || '') ? 'text-white opacity-80' : 'text-gray-600'}`}
                            >
                                PDF Document • Tap to open
                            </Text>
                        </View>
                        <Ionicons
                            name="eye"
                            size={20}
                            color={isSender(msg.sender || msg.sender_id || '') ? "#ffffff" : "#0066CC"}
                        />
                    </TouchableOpacity>
                );
            }
            // If we have a file but can't determine the type, show the message text
            else {
                return (
                    <Text className={`${isSender(msg.sender || msg.sender_id || '') ? 'text-white' : 'text-black'} font-Jakarta`}>
                        {message || `File: ${fileName}`}
                    </Text>
                );
            }
        } catch (error) {
            console.error("Error rendering message:", error);
            // Fallback rendering in case of errors
            return (
                <Text className="text-red-500 font-Jakarta">
                    Error displaying message content
                </Text>
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                {patient ? (

                    <>
                        <View className="relative">
                            <Image
                                source={{ uri: patient.profile_picture }}
                                className="w-12 h-12 rounded-full"
                            />
                            {onlineUsers.has(patient.id) ? (
                                <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            ) : <View className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
                        </View>
                        <View className="ml-3">
                            <Text className="font-JakartaBold text-lg">{patient.name}</Text>
                            <View className="flex-row items-center">
                                <Text className="font-Jakarta text-xs text-gray-500">Patient</Text>
                                {chatLocked && (
                                    <View className="flex-row items-center ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                                        <Ionicons name="lock-closed" size={12} color="#777" />
                                        <Text className="font-JakartaBold text-xs text-gray-500 ml-1">Read-only</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </>
                ) : (
                    // Patient info loading skeleton
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full ml-4 bg-gray-200 animate-pulse" />
                        <View className="ml-3">
                            <View className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                            <View className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                        </View>
                    </View>
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                {/* Header with appointment info for context */}
                {patientAppointments.length > 1 && (
                    <View className="bg-blue-50 p-2 border-b border-blue-100">
                        <Text className="text-center text-xs font-JakartaSemiBold text-blue-700">
                            Patient has {patientAppointments.length} appointments • Current: {String(appointmentStatus)}
                        </Text>
                    </View>
                )}

                {/* Add status ribbon at the top of the chat */}
                {chatLocked && (
                    <View className={`p-2 ${String(appointmentStatus).toLowerCase() === 'completed' ? 'bg-green-50 border-b border-green-100' :
                        String(appointmentStatus).toLowerCase() === 'cancelled' ? 'bg-red-50 border-b border-red-100' :
                            'bg-yellow-50 border-b border-yellow-100'
                        }`}>
                        <Text className={`text-center text-sm font-JakartaBold ${String(appointmentStatus).toLowerCase() === 'completed' ? 'text-green-700' :
                            String(appointmentStatus).toLowerCase() === 'cancelled' ? 'text-red-700' :
                                'text-yellow-700'
                            }`}>
                            {String(appointmentStatus).toLowerCase() === 'completed' ? '✓ Completed Appointment' :
                                String(appointmentStatus).toLowerCase() === 'cancelled' ? '✕ Cancelled Appointment' :
                                    '⌛ Pending Approval'}
                        </Text>
                    </View>
                )}

                <ScrollView
                    className="flex-1 px-4"
                    ref={scrollViewRef}
                    onContentSizeChange={() => {
                        try {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        } catch (error) {
                            console.error("Error scrolling to end:", error);
                        }
                    }}
                >
                    {shouldShowLoadingSkeletons() ? (
                        // Show skeleton loading messages only on initial load with no cached data
                        <>
                            {skeletonMessages.map((msg, index) => (
                                <MessageSkeleton key={`skeleton-${index}`} isReceived={msg.isReceived} />
                            ))}
                        </>
                    ) : messages.length === 0 ? (
                        <View className="py-8 items-center">
                            <Text className="text-gray-500">No messages yet. Say hello!</Text>
                        </View>
                    ) : (
                        <>
                            {/* Debug message count */}
                            <Text className="text-xs text-gray-400 text-center my-2">
                                {messages.length} message(s) loaded
                            </Text>

                            {/* Render messages with fixed sender identification */}
                            {messages.map((msg, index) => {
                                // Determine if this message was sent by the current user (doctor)
                                const senderIsCurrentUser = isSender(msg.sender || '');
                                const hasFile = !!(msg.fileUrl || msg.file_url);

                                return (
                                    <View
                                        key={msg.id || `msg-${index}-${Date.now()}`}
                                        className={`flex mb-4 mt-2 ${senderIsCurrentUser ? 'items-end' : 'items-start'}`}
                                    >
                                        <View
                                            className={`max-w-[85%] ${senderIsCurrentUser
                                                ? 'bg-blue-500 rounded-t-2xl rounded-bl-2xl'
                                                : 'bg-gray-100 rounded-t-2xl rounded-br-2xl'
                                                } px-3 py-2`}
                                        >
                                            {/* Use the renderMessageContent function for content */}
                                            {renderMessageContent(msg)}
                                        </View>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            {formatMessageTime(msg.timestamp || new Date())}
                                        </Text>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>

                {/* Show locked chat notice */}
                {chatLocked && (
                    <View className={`p-3 ${String(appointmentStatus).toLowerCase() === 'completed' ? 'bg-green-50 border-t border-green-100' :
                        String(appointmentStatus).toLowerCase() === 'cancelled' ? 'bg-red-50 border-t border-red-100' :
                            'bg-yellow-50 border-t border-yellow-100'
                        }`}>
                        <Text className={`text-center font-JakartaSemiBold ${String(appointmentStatus).toLowerCase() === 'completed' ? 'text-green-700' :
                            String(appointmentStatus).toLowerCase() === 'cancelled' ? 'text-red-700' :
                                'text-yellow-700'
                            }`}>
                            {getLockMessage()}
                        </Text>
                    </View>
                )}

                {/* Chat input field with attachment options */}
                <View className={`p-4 border-t border-gray-100 bg-white ${chatLocked ? 'opacity-60' : ''}`}>
                    {isUploading && (
                        <View className="mb-2 p-2 bg-blue-50 rounded-lg flex-row items-center justify-center">
                            <ActivityIndicator size="small" color="#0066CC" />
                            <Text className="ml-2 text-blue-700 text-sm">Uploading file...</Text>
                        </View>
                    )}

                    <View className="flex-row items-center">
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={handlePickImage}
                                disabled={shouldShowLoadingSkeletons() || isUploading || chatLocked}
                                className={`p-2 ${(shouldShowLoadingSkeletons() || isUploading || chatLocked) ? 'opacity-50' : ''}`}
                            >
                                <Ionicons name="image" size={24} color={chatLocked ? "#9CA3AF" : "#0066CC"} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handlePickDocument}
                                disabled={shouldShowLoadingSkeletons() || isUploading || chatLocked}
                                className={`p-2 ${(shouldShowLoadingSkeletons() || isUploading || chatLocked) ? 'opacity-50' : ''}`}
                            >
                                <Ionicons name="document" size={24} color={chatLocked ? "#9CA3AF" : "#0066CC"} />
                            </TouchableOpacity>
                        </View>

                        <View className={`flex-1 flex-row items-center rounded-full px-4 py-2 ml-2 ${chatLocked ? 'bg-gray-100' : 'bg-gray-50'}`}>
                            <TextInput
                                className="flex-1 font-Jakarta"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                placeholder={chatLocked
                                    ? `Appointment ${appointmentStatus} - Chat locked`
                                    : shouldShowLoadingSkeletons()
                                        ? "Loading chat history..."
                                        : "Type your message..."}
                                multiline
                                editable={!shouldShowLoadingSkeletons() && !isUploading && !chatLocked}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!newMessage.trim() || shouldShowLoadingSkeletons() || isUploading || chatLocked}
                                className={`ml-2 ${(!newMessage.trim() || shouldShowLoadingSkeletons() || isUploading || chatLocked) ? 'opacity-50' : ''}`}
                            >
                                <Ionicons
                                    name={chatLocked ? "lock-closed" : "send"}
                                    size={24}
                                    color={chatLocked ? "#9CA3AF" : "#3b82f6"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
            {viewerContent && (

                <ReportViewer
                    visible={!!viewerContent}
                    onClose={() => { setViewerVisible(false); setViewerContent(null); }}
                    fileUrl={viewerContent.fileUrl}
                    fileType={viewerContent.fileType}
                    title={viewerContent.title}
                />
                // <ReportViewer
                //     visible={viewerVisible}
                //     onClose={() => {
                //         setViewerVisible(false);
                //         setViewerContent(null);
                //     }}
                //     fileUrl={viewerContent.fileUrl}
                //     fileType={viewerContent.fileType}
                //     title={viewerContent.title}
                // />
            )}
        </SafeAreaView>
    );
};

export default ChatRoom;
