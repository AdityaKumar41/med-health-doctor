import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

type Props = {
    bgColor: string;
    title: string;
    description: string;
    imageUri: any;
    onPress: () => void;
};

export const ServiceCard = ({
    bgColor,
    title,
    description,
    imageUri,
    onPress,
}: Props) => {
    return (

        <TouchableOpacity
            className={`flex flex-col self-stretch p-4 my-auto ${bgColor} rounded-xl w-[175px] h-fit`} onPress={onPress} >


            <Image
                source={imageUri}
                className="object-contain rounded-lg aspect-square w-[42px]"
            />

            <View className="flex flex-col mt-3 w-full">
                <View className="text-2xl font-bold leading-7 text-zinc-900">
                    <Text className="font-JakartaExtraBold text-xl">{title}</Text>
                </View>
                <View className="text-xs font-medium leading-5 text-zinc-500">
                    <Text className="font-Jakarta">{description}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};
