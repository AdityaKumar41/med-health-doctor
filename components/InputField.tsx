import { TextInput, View, Text, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  error,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  placeholder,
  value,

  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text
            className={`text-lg font-JakartaMedium mb-3 text-gray-800 ${labelStyle}`}
          >
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-white rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'
              } focus:border-black ${containerStyle}`}
          >
            {icon && (
              <Ionicons
                name={icon as any}
                size={20}
                color={error ? '#ef4444' : '#6b7280'}
                style={{ marginLeft: 16 }}
              />
            )}
            <TextInput
              className={`rounded-lg p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle
                } text-left text-gray-900`}
              secureTextEntry={secureTextEntry}
              placeholderTextColor="gray"
              placeholder={placeholder}
              {...props}
            />
          </View>
          {error && (
            <Text className="text-red-500 text-sm mt-1 font-JakartaRegular">
              {error}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
