import React from 'react';
import { View, TextInput } from 'react-native';
import type { SearchBarProps } from '@/types/type';

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder }) => {
  return (
    <View className="flex gap-2 items-start mt-4 w-full">
      <View className="flex flex-col flex-1 shrink text-sm font-medium tracking-wide leading-6 basis-6 min-w-[240px] text-zinc-500">
        <View className="flex gap-3 items-start p-3 w-full bg-white rounded-xl border border-gray-300 border-solid">
          <View className="flex shrink-0 w-6 h-6" />
          <TextInput
            className="flex-1 shrink basis-0 text-ellipsis"
            placeholder={placeholder}
            accessibilityLabel={placeholder}
          />
        </View>
      </View>
      <View className="flex overflow-hidden gap-3 justify-center items-center px-3 w-12 h-12 bg-purple-50 rounded-lg shadow-sm">
        <View className="flex self-stretch my-auto w-6 min-h-[24px]" />
      </View>
    </View>
  );
};