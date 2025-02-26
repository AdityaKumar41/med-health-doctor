import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/Button";
import { router } from "expo-router";
import { useAccount, useWriteContract } from "wagmi";
import { Ionicons } from '@expo/vector-icons';
import { FormData, FormErrors, InputDetailType } from "@/types/type";
import axios from "axios";
import { useDoctor, useDoctorPost } from "@/hooks/useDoctor";
import abi from "../../contract/Contract.json"
import * as ImagePicker from 'expo-image-picker';
import { useAws } from "@/hooks/useAws";
import { useSpecialization } from "@/hooks/useSpecialization";
import MapView, { Marker } from 'react-native-maps';

const Register = () => {
  const { address } = useAccount();
  const { data } = useDoctor(address!);
  const { data: getSignedUrl } = useAws(address!);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    age: 0,
    hospital: '',
    experience: '',
    qualification: '',
    bio: '',
    location_lat: '',
    location_lng: '',
    specialties: [],
    profile_picture: '',
    profileImage: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { mutate } = useDoctorPost(address!);
  const { data: specializations, isLoading: loadingSpecializations } = useSpecialization();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
  });

  useEffect(() => {
    if (data) {
      router.replace("/(root)/(tabs)");
    }
  }, [data]);

  const InputDetails: InputDetailType[] = [
    {
      label: "Full Name",
      placeholder: "Dr. John Doe",
      key: "name",
      icon: "person-outline",
      keyboardType: "default"
    },
    {
      label: "Email",
      placeholder: "doctor@example.com",
      key: "email",
      icon: "mail-outline",
      keyboardType: "email-address"
    },
    {
      label: "Age",
      placeholder: "Enter your age",
      key: "age",
      icon: "calendar-outline",
      keyboardType: "numeric"
    },
    {
      label: "Hospital",
      placeholder: "Enter hospital name",
      key: "hospital",
      icon: "business-outline",
      keyboardType: "default"
    },
    {
      label: "Experience (years)",
      placeholder: "Years of experience",
      key: "experience",
      icon: "briefcase-outline",
      keyboardType: "numeric"
    },
    {
      label: "Qualification",
      placeholder: "Enter your qualifications",
      key: "qualification",
      icon: "school-outline",
      keyboardType: "default"
    },
    {
      label: "Bio",
      placeholder: "Brief description about yourself",
      key: "bio",
      icon: "information-circle-outline",
      keyboardType: "default"
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 0) {
      newErrors.age = "Please enter a valid age";
    }

    // Hospital validation
    if (!formData.hospital.trim()) {
      newErrors.hospital = "Hospital name is required";
    }

    // Experience validation
    if (!formData.experience || isNaN(Number(formData.experience))) {
      newErrors.experience = "Please enter valid years of experience";
    }

    // Qualification validation
    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualification is required";
    }

    // Bio validation
    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    }

    // Replace lat/lng validation with selected location validation
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      newErrors.location = "Please select your location on the map";
    }

    if (selectedSpecialties.length === 0) {
      newErrors.specialties = "Please select at least one specialization";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setFormData(prev => ({
        ...prev,
        profileImage: result.assets[0]
      }));
    }
  };

  const handleOnRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      let profilePictureUrl = '';

      if (formData.profileImage) {
        // Get signed URL from AWS
        const signedUrl = await getSignedUrl();

        // Upload image to S3
        const response = await fetch(formData.profileImage.uri);
        const blob = await response.blob();
        await fetch(signedUrl.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });

        profilePictureUrl = signedUrl.url;
      }

      const response = mutate({
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        wallet_address: address!,
        hospital: formData.hospital,
        experience: Number(formData.experience),
        qualification: formData.qualification,
        bio: formData.bio,
        location_lat: parseFloat(formData.location_lat),
        location_lng: parseFloat(formData.location_lng),
        available_days: [], // This can be set up in a separate screen
        specialties: selectedSpecialties,
        profile_picture: profilePictureUrl,
      });

      console.log("response is ", response);
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderProfilePicture = () => (
    <View className="mb-6">
      <Text className="font-JakartaMedium text-base mb-2">Profile Picture</Text>
      <TouchableOpacity
        onPress={pickImage}
        className="items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4"
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            className="w-32 h-32 rounded-full"
          />
        ) : (
          <View className="items-center">
            <Ionicons name="camera-outline" size={40} color="gray" />
            <Text className="text-gray-500 mt-2">Upload Profile Picture</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSpecializations = () => (
    <View className="mb-6">
      <Text className="font-JakartaMedium text-base mb-2">Specializations</Text>
      <View className="flex-row flex-wrap gap-2">
        {specializations?.map((spec: Specialization) => (
          <TouchableOpacity
            key={spec.id}
            onPress={() => {
              if (selectedSpecialties.includes(spec.id)) {
                setSelectedSpecialties(prev => prev.filter(id => id !== spec.id));
              } else {
                setSelectedSpecialties(prev => [...prev, spec.id]);
              }
            }}
            className={`px-4 py-2 rounded-full border ${selectedSpecialties.includes(spec.id)
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white border-gray-300'
              }`}
          >
            <Text
              className={`font-JakartaMedium ${selectedSpecialties.includes(spec.id) ? 'text-white' : 'text-gray-700'
                }`}
            >
              {spec.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.specialties && (
        <Text className="text-red-500 text-sm mt-1">{errors.specialties}</Text>
      )}
    </View>
  );

  const renderLocationPicker = () => (
    <View className="mb-6">
      <Text className="font-JakartaMedium text-base mb-2">Select Location</Text>
      <View className="h-[200px] w-full rounded-lg overflow-hidden">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={(e) => {
            setSelectedLocation(e.nativeEvent.coordinate);
            setFormData(prev => ({
              ...prev,
              location_lat: e.nativeEvent.coordinate.latitude.toString(),
              location_lng: e.nativeEvent.coordinate.longitude.toString(),
            }));
          }}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
            />
          )}
        </MapView>
      </View>
      {errors.location && (
        <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 mt-8">
          <Text className="font-JakartaExtraBold text-4xl mb-3">Create Account</Text>
          <Text className="font-JakartaRegular text-base text-gray-600 mb-2">
            Please fill in your details to get started
          </Text>
          {address && (
            <Text className="font-JakartaMedium text-sm text-gray-500 mb-4">
              Wallet: {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
          )}
        </View>

        <View className="px-6">
          {renderProfilePicture()}
          {InputDetails.map((input, index) => (
            <View key={index} className="mb-2">
              <InputField
                label={input.label}
                placeholder={input.placeholder}
                value={formData[input.key]}
                onChangeText={(text: string) => handleInputChange(input.key, text)}
                error={errors[input.key]}
                secureTextEntry={input.secureTextEntry}
                keyboardType={input.keyboardType}
                icon={input.icon}
              />
              {errors[input.key] && (
                <Text className="text-red-500 text-sm mt-1">{errors[input.key]}</Text>
              )}
            </View>
          ))}
          {renderLocationPicker()}
          {renderSpecializations()}
        </View>

        <View className="p-6">
          <Button
            text={loading ? "Creating Account..." : "Create Account"}
            onClick={handleOnRegister}
            disabled={loading}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Register;
