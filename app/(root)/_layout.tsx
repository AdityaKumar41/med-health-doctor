import React from 'react'
import { Stack } from 'expo-router'
import { useAccount } from 'wagmi';
import { router } from 'expo-router';

const Root = () => {
    const { isConnected, address, isReconnecting } = useAccount();

    React.useEffect(() => {
        if (isReconnecting && !isConnected) {
            router.replace("/(auth)/welcome");
        }
    }, [isConnected]);
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    )
}

export default Root