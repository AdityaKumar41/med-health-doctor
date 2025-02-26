import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { AppointmentButtonProps } from "@/types";

export const Button: React.FC<AppointmentButtonProps> = ({
  text,
  onClick,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onClick}
      className="px-6 py-4 w-full bg-blue-700 rounded-lg shadow-sm min-w-[240px] items-center"
      accessibilityRole="button"
      accessibilityLabel={text}
      {...props}

    >
      <Text className="font-JakartaBold text-xl text-white w-full text-center items-center">{text}</Text>
    </TouchableOpacity>
  );
};
