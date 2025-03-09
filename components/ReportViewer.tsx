import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface ReportViewerProps {
    visible: boolean;
    onClose: () => void;
    fileUrl: string;
    fileType: string;
    title: string;
}

const ReportViewer = ({ visible, onClose, fileUrl, fileType, title }: ReportViewerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add cache busting to URLs to ensure fresh content
    const getUrlWithCacheBusting = (url: string) => {
        if (!url) return '';

        // Add timestamp if not already present
        if (url.includes('?')) {
            return `${url}&t=${Date.now()}`;
        } else {
            return `${url}?t=${Date.now()}`;
        }
    };

    const processedUrl = getUrlWithCacheBusting(fileUrl);

    // Reset loading state when URL changes
    useEffect(() => {
        if (visible) {
            setIsLoading(true);
            setError(null);
        }
    }, [fileUrl, visible]);

    // Determine if this is an image or PDF
    const isImage = fileType.includes('image');
    const isPdf = fileType.includes('pdf');

    // Log the URL being loaded for debugging purposes
    useEffect(() => {
        if (visible) {
            console.log(`Loading file in viewer: ${processedUrl}, type: ${fileType}`);
        }
    }, [visible, processedUrl, fileType]);

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <View style={{ width: 24 }} /> {/* Empty space for balanced header */}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Loading file...</Text>
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setError(null);
                                    setIsLoading(true);
                                }}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isImage && !error && (
                        <Image
                            source={{ uri: processedUrl, headers: { Accept: fileType } }}
                            style={styles.image}
                            resizeMode="contain"
                            onLoadStart={() => setIsLoading(true)}
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError('Failed to load image. The file may be corrupted or inaccessible.');
                            }}
                        />
                    )}

                    {isPdf && !error && (
                        <WebView
                            source={{
                                uri: processedUrl,
                                headers: { 'Content-Type': 'application/pdf', 'Accept': 'application/pdf' }
                            }}
                            style={styles.webView}
                            onLoadStart={() => setIsLoading(true)}
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError('Failed to load PDF. The file may be corrupted or inaccessible.');
                            }}
                            originWhitelist={['*']}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            scalesPageToFit={true}
                            mixedContentMode="always"
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF'
    },
    backButton: {
        padding: 8
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8
    },
    content: {
        flex: 1,
        position: 'relative'
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007AFF'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        color: '#333333'
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    webView: {
        flex: 1,
        width: '100%',
        height: '100%'
    }
});

export default ReportViewer;
