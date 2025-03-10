import { View, Text, ScrollView, TouchableOpacity, Image, Modal, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/Button";
import { router } from "expo-router";
import { useAccount } from "wagmi";
import { Ionicons } from '@expo/vector-icons';
import { FormDataRedg, FormErrors, InputDetailType } from "@/types/type";
import { useDoctor, useDoctorPost } from "@/hooks/useDoctor";
import * as ImagePicker from 'expo-image-picker';
import { useSignedUrl } from "@/hooks/useAws";
import { useSpecialization } from "@/hooks/useSpecialization";
import MapView, { Marker } from 'react-native-maps';

// Define the Specialization interface
interface Specialization {
  id: string;
  name: string;
}

// Define a proper type for selected image
interface SelectedImageType {
  uri: string;
  filetype: string | null;
}

// Define the AvailableTime interface
interface AvailableTime {
  start_time: string;
  end_time: string;
}

// Update FormData type to include profileImage, available days, and time
interface ExtendedFormData extends FormDataRedg {
  profileImage: ImagePicker.ImagePickerAsset | null;
  filetype: string;
  available_days: string[];
  available_time: AvailableTime[];
  doctor_id: string;
  wallet_address: string;
  locationwork: {
    latitude: number;
    longitude: number;
  };
}

const Register = () => {
  const { address } = useAccount();
  const { data } = useDoctor(address!);
  const signedUrlMutation = useSignedUrl(address!);
  const [selectedImage, setSelectedImage] = useState<SelectedImageType | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTime, setAvailableTime] = useState<AvailableTime[]>([
    { start_time: "09:00", end_time: "17:00" }
  ]);
  const [formData, setFormData] = useState<ExtendedFormData>({
    name: '',
    email: '',
    age: 0,
    hospital: '',
    experience: 0,
    qualification: '',
    bio: '',
    location_lat: '',
    location_lng: '',
    specialties: [],
    profile_picture: '',
    profileImage: null,
    filetype: '',
    available_days: [],
    available_time: [],
    doctor_id: '',
    wallet_address: '',
    locationwork: {
      latitude: 0,
      longitude: 0,
    },
    consultancy_fees: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { mutate } = useDoctorPost(address!);
  const { data: specializations, isLoading: loadingSpecializations } = useSpecialization();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
  });
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

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
    },
    {
      label: "Registration No",
      placeholder: "Enter your registration number",
      key: "doctor_id",
      icon: "id-card-outline",
      keyboardType: "default"
    },
    {
      label: "Consultancy Fees",
      placeholder: "Enter your consultancy fees in crypto",
      key: "consultancy_fees",
      icon: "cash-outline",
      keyboardType: "numeric"
    }
  ];

  const weekdays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
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

    // Validate profile image
    if (!formData.profileImage) {
      newErrors.profileImage = "Profile picture is required";
    }

    // Validate available days
    if (availableDays.length === 0) {
      newErrors.availableDays = "Please select at least one available day";
    }

    // Validate available time
    if (availableTime.length === 0 ||
      !availableTime[0].start_time ||
      !availableTime[0].end_time) {
      newErrors.availableTime = "Please set your available time slots";
    }

    // Doctor ID validation
    if (!formData.doctor_id.trim()) {
      newErrors.doctor_id = "Registration number is required";
    }

    // Consultancy Fees validation
    if (!formData.consultancy_fees) {
      newErrors.consultancy_fees = "Consultancy fees are required";
    } else if (isNaN(Number(formData.consultancy_fees)) || Number(formData.consultancy_fees) < 0) {
      newErrors.consultancy_fees = "Please enter a valid consultancy fee";
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
    if (key in errors && errors[key as keyof FormErrors]) {
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

    // console.log("picture", result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg'; // Default to jpeg if mimeType is null

      setSelectedImage({
        uri: asset.uri,
        filetype: mimeType
      });

      setFormData(prev => ({
        ...prev,
        profileImage: asset,
        filetype: mimeType,
      }));
    }
  };

  // Helper function to upload image
  const uploadImage = async (imageUri: string, imageName: string, imageType: string, uploadUrl: string) => {
    const file = {
      uri: imageUri,
      name: imageName,
      type: imageType,
    };

    const response = await fetch(imageUri);
    const blob = await response.blob();

    console.log("Uploading image:", file);
    console.log("Blob data:", blob);

    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': imageType,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${uploadResponse.statusText} - ${errorText}`);
      }

      return uploadResponse;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleOnRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      let profilePictureUrl = '';

      if (formData.profileImage) {
        // Get signed URL for S3 upload
        const fileType = formData.filetype || 'image/jpeg';
        const fileExt = fileType.split('/')[1] || 'jpg';
        const imageName = `profile-${address}-${Date.now()}.${fileExt}`;

        const signedUrlResult = await signedUrlMutation.mutateAsync({
          filename: imageName,
          filetype: fileType,
        });

        console.log("Signed URL result:", signedUrlResult);

        // Upload image to S3 using the helper function
        await uploadImage(formData.profileImage.uri, imageName, fileType, signedUrlResult.url);

        profilePictureUrl = signedUrlResult.url.split('?')[0]; // Extract the URL without query parameters
      }

      // Call the API to register the doctor
      mutate({
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        doctor_id: formData.doctor_id,
        hospital: formData.hospital,
        experience: Number(formData.experience),
        qualification: formData.qualification,
        bio: formData.bio,
        specialties: selectedSpecialties,
        profile_picture: profilePictureUrl,
        wallet_address: address!,
        locationwork: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
        available_days: availableDays,
        available_time: availableTime,
        consultancy_fees: Number(formData.consultancy_fees),
      });

      // router.replace("/(root)/(tabs)");
    } catch (error) {
      console.error("Registration error:", error);
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
            source={{ uri: selectedImage.uri }}
            className="w-32 h-32 rounded-full"
          />
        ) : (
          <View className="items-center">
            <Ionicons name="camera-outline" size={40} color="gray" />
            <Text className="text-gray-500 mt-2">Upload Profile Picture</Text>
          </View>
        )}
      </TouchableOpacity>
      {errors.profileImage && (
        <Text className="text-red-500 text-sm mt-1">{errors.profileImage}</Text>
      )}
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
            const coordinate = e.nativeEvent.coordinate;
            if (coordinate) {
              setSelectedLocation({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude
              });

              setFormData(prev => ({
                ...prev,
                locationwork: {
                  latitude: coordinate.latitude,
                  longitude: coordinate.longitude,
                },
              }));
            }
          }}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
              }}
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const addTimeSlot = () => {
    setAvailableTime(prev => [...prev, { start_time: "09:00", end_time: "17:00" }]);
  };

  const removeTimeSlot = (index: number) => {
    setAvailableTime(prev => prev.filter((_, i) => i !== index));
  };

  const renderAvailableDays = () => (
    <View className="mb-6">
      <Text className="font-JakartaMedium text-base mb-2">Available Days</Text>
      <View className="flex-row flex-wrap gap-2">
        {weekdays.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => {
              if (availableDays.includes(day)) {
                setAvailableDays(prev => prev.filter(d => d !== day));
              } else {
                setAvailableDays(prev => [...prev, day]);
              }
            }}
            className={`px-4 py-2 rounded-full border ${availableDays.includes(day)
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white border-gray-300'
              }`}
          >
            <Text
              className={`font-JakartaMedium ${availableDays.includes(day) ? 'text-white' : 'text-gray-700'
                }`}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.availableDays && (
        <Text className="text-red-500 text-sm mt-1">{errors.availableDays}</Text>
      )}
    </View>
  );

  const renderAvailableTime = () => (
    <View className="mb-6">
      <Text className="font-JakartaMedium text-base mb-2">Available Hours</Text>
      {availableTime.map((timeSlot, index) => (
        <View key={index} className="flex-row items-center justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-sm text-gray-600 mb-1">Start Time</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md p-3"
              onPress={() => setShowStartTimeModal(true)}
            >
              <Text>{timeSlot.start_time || "Select time"}</Text>
            </TouchableOpacity>
            <Modal
              visible={showStartTimeModal}
              transparent={true}
              animationType="slide"
            >
              <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-4/5 h-1/2 rounded-lg p-4">
                  <Text className="font-JakartaBold text-lg mb-4 text-center">Select Start Time</Text>
                  <FlatList
                    data={timeSlots}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className={`p-3 border-b border-gray-100 ${timeSlot.start_time === item ? "bg-blue-100" : ""}`}
                        onPress={() => {
                          setAvailableTime(prev => {
                            const newTimeSlots = [...prev];
                            newTimeSlots[index] = { ...newTimeSlots[index], start_time: item };
                            return newTimeSlots;
                          });
                          setShowStartTimeModal(false);
                        }}
                      >
                        <Text className="text-center">{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    className="mt-4 bg-gray-200 p-3 rounded-lg"
                    onPress={() => setShowStartTimeModal(false)}
                  >
                    <Text className="text-center font-JakartaMedium">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View className="flex-1 ml-2">
            <Text className="text-sm text-gray-600 mb-1">End Time</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-md p-3"
              onPress={() => setShowEndTimeModal(true)}
            >
              <Text>{timeSlot.end_time || "Select time"}</Text>
            </TouchableOpacity>
            <Modal
              visible={showEndTimeModal}
              transparent={true}
              animationType="slide"
            >
              <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-4/5 h-1/2 rounded-lg p-4">
                  <Text className="font-JakartaBold text-lg mb-4 text-center">Select End Time</Text>
                  <FlatList
                    data={timeSlots}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className={`p-3 border-b border-gray-100 ${timeSlot.end_time === item ? "bg-blue-100" : ""}`}
                        onPress={() => {
                          setAvailableTime(prev => {
                            const newTimeSlots = [...prev];
                            newTimeSlots[index] = { ...newTimeSlots[index], end_time: item };
                            return newTimeSlots;
                          });
                          setShowEndTimeModal(false);
                        }}
                      >
                        <Text className="text-center">{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    className="mt-4 bg-gray-200 p-3 rounded-lg"
                    onPress={() => setShowEndTimeModal(false)}
                  >
                    <Text className="text-center font-JakartaMedium">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <TouchableOpacity
            className="ml-2 p-2 bg-red-500 rounded-full"
            onPress={() => removeTimeSlot(index)}
          >
            <Ionicons name="remove-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        className="mt-4 bg-blue-500 p-3 rounded-lg"
        onPress={addTimeSlot}
      >
        <Text className="text-center text-white font-JakartaMedium">Add Time Slot</Text>
      </TouchableOpacity>
      {errors.availableTime && (
        <Text className="text-red-500 text-sm mt-1">{errors.availableTime}</Text>
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
                value={String(formData[input.key])}
                onChangeText={(text: string) => handleInputChange(input.key as keyof FormData, text)}
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
          {renderAvailableDays()}
          {renderAvailableTime()}
          {errors.submit && (
            <Text className="text-red-500 text-sm mt-1 text-center">{errors.submit}</Text>
          )}
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