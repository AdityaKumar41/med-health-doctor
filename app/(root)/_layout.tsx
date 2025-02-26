import React from 'react'
import { Stack } from 'expo-router'

const Root = () => {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    )
}

export default Root