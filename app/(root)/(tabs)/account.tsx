import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useAccount } from "wagmi";
import { Ionicons } from "@expo/vector-icons";
import { useAppKit } from "@reown/appkit-wagmi-react-native";
import { Button } from "@/components/ui/Button";
import { router } from "expo-router";
import { MenuSectionProps } from "@/types/type";
import { StatusBar } from "expo-status-bar";
import { useDoctor, useDoctorUpdate } from "@/hooks/useDoctor";
import { useSignedUrl } from "@/hooks/useAws";
import axios from "axios";
import * as FileSystem from 'expo-file-system';
import { avarageRating } from "@/utils";

const Account = () => {
  const { address, isConnected } = useAccount();
  const { data, refetch } = useDoctor(address!);
  const { mutate: updateDoctor, isPending: isUpdating } = useDoctorUpdate(address!);
  const { mutate: getSignedUrl, isPending: isUploadingImage } = useSignedUrl(address!);

  const { open } = useAppKit();
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract specialties properly from the API response
  const specialtiesList = data?.specialties?.map((item: { specialty: { name: any; id: string; }; }) => ({
    name: item.specialty?.name,
    id: item.specialty?.id
  })).filter(Boolean) || [];

  const specialtiesDisplay = specialtiesList.map((spec: { name: any; }) => spec.name).join(", ");
  const [selectedSpecialties, setSelectedSpecialties] = useState(specialtiesList);

  const [name, setName] = useState(data?.name || "Dr. Smith");
  const [specialization, setSpecialization] = useState(specialtiesDisplay || "General Physician");
  const [consultancyFees, setConsultancyFees] = useState(data?.consultancy_fees?.toString() || "0");
  const [profileImage, setProfileImage] = useState(
    data?.profile_picture ||
    "https://cdn.builder.io/api/v1/image/assets/95a3c52e460440f58cf6776b478813ea/d6954879c6447b5b7d4cb004f31f770ede1b0a30c57fa508d0fbb42671a80517"
  );
  const [imageChanged, setImageChanged] = useState(false);

  // State to track all updated fields
  const [updatedData, setUpdatedData] = useState({});

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  // Handle image upload to AWS S3
  const uploadProfilePicture = async (imageUri: string) => {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error("File doesn't exist");
      }

      // Get file extension and generate name
      const fileExtension = imageUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;

      // Get mime type based on extension
      let mimeType;
      if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else {
        mimeType = 'image/jpeg'; // Default
      }

      // Request signed URL from backend
      return new Promise((resolve, reject) => {
        getSignedUrl(
          {
            filename: fileName,
            filetype: mimeType,
          },
          {
            onSuccess: async (signedUrlData) => {
              try {
                console.log('Got signed URL:', signedUrlData);

                // Upload file to S3
                const fileContent = await FileSystem.readAsStringAsync(imageUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                await axios.put(signedUrlData.url,
                  Buffer.from(fileContent, 'base64'),
                  {
                    headers: {
                      'Content-Type': mimeType,
                    },
                  }
                );

                // Return the S3 URL of the uploaded file
                const s3Url = `${process.env.EXPO_PUBLIC_AWS_S3_BASE_URL}/${signedUrlData.key}`;
                resolve(s3Url);
              } catch (error) {
                console.error('Error uploading to S3:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Error getting signed URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw error;
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        setIsProcessing(true);

        // Handle profile picture upload if changed
        let profilePictureUrl = profileImage;
        if (imageChanged && profileImage !== data?.profile_picture) {
          try {
            profilePictureUrl = await uploadProfilePicture(profileImage) as string;
            console.log('Profile picture uploaded:', profilePictureUrl);
          } catch (error) {
            console.error('Failed to upload profile picture:', error);
            Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
            setIsProcessing(false);
            return;
          }
        }

        // Prepare all updated data
        const dataToUpdate = {
          doctor_id: data?.id || '',
          wallet_address: address || '',
          name,
          profile_picture: profilePictureUrl,
          consultancy_fees: parseFloat(consultancyFees),
          specialty_ids: selectedSpecialties.map((spec: { id: any; }) => spec.id),
          email: data?.email || '',
          age: data?.age || 0,
          hospital: data?.hospital || '',
          experience: data?.experience || 0,
          qualification: data?.qualification || '',
          bio: data?.bio || '',
          available_days: data?.available_days || [],
          specialties: data?.specialties || [],
          ...updatedData
        };

        console.log("Data to be updated:", dataToUpdate);

        // Update doctor profile
        updateDoctor(dataToUpdate, {
          onSuccess: (response) => {
            console.log('Profile updated successfully:', response);
            Alert.alert('Success', 'Profile updated successfully!');
            refetch(); // Refresh doctor data
            setImageChanged(false);
          },
          onError: (error) => {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
          },
          onSettled: () => {
            setIsProcessing(false);
          }
        });

      } catch (error) {
        console.error('Error in handleEditToggle:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        setIsProcessing(false);
      }
    }

    if (!isProcessing) {
      setIsEditing(!isEditing);
    }
  };

  // Helper function to update specialty selection
  const updateSpecialty = (specialtyString: string) => {
    // This is a simplified approach. In a real app, you might want to 
    // implement a proper specialty selection UI with checkboxes instead
    const specialtyNames = specialtyString.split(", ").map(name => name.trim());

    // Try to match with existing specialties or keep original IDs where possible
    const updatedSpecialties = specialtyNames.map(name => {
      // Try to find matching specialty in original list
      const existingSpecialty = specialtiesList.find((s: { name: string; }) => s.name.toLowerCase() === name.toLowerCase());
      return existingSpecialty || { name, id: `new-${name}` }; // Use existing ID if found, or mark as new
    });

    setSelectedSpecialties(updatedSpecialties);
    setSpecialization(specialtyNames.join(", "));
    updateField('specialty_ids', updatedSpecialties.map(spec => spec.id));
  };

  const updateField = (field: string, value: any) => {
    setUpdatedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!address) {
    router.replace("/(auth)/welcome");
  }

  const doctorInfo = {
    name: "Dr. Smith",
    specialization: "General Physician",
    email: "dr.smith@healthcare.com",
    location: "Medical Center",
    experience: "15 years",
    totalPatients: 1200,
    todayAppointments: 8,
    rating: 4.8,
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header Section */}
      <View className="bg-blue-600 pt-12 pb-24 rounded-b-[40px] shadow-lg">
        <View className="px-4 flex-row justify-between items-center w-full">
          <Text className="text-white text-lg font-JakartaBold">My Profile</Text>
          <TouchableOpacity onPress={handleEditToggle} disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons
                name={isEditing ? "checkmark-circle" : "create-outline"}
                size={24}
                color="white"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View className="px-4 -mt-16">
        <View className="bg-white rounded-3xl p-4 shadow-lg">
          <View className="items-center">
            <TouchableOpacity
              onPress={isEditing ? pickImage : undefined}
              className="relative"
              disabled={isUploadingImage}
            >
              <Image
                source={{ uri: profileImage }}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              {isEditing && (
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                  {isUploadingImage ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="camera" size={16} color="white" />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {isEditing ? (
              <>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="font-JakartaBold text-2xl mt-2 text-center border-b border-gray-300 p-1"
                />
                <TextInput
                  value={specialization}
                  onChangeText={setSpecialization}
                  className="text-blue-500 text-sm mt-1 text-center border-b border-gray-300 p-1"
                />
              </>
            ) : (
              <>
                <Text className="font-JakartaBold text-2xl mt-2">{name}</Text>
                <Text className="text-blue-500 text-sm mt-1">{specialization}</Text>
              </>
            )}

            {isConnected && (
              <Text className="text-blue-500 text-sm mt-1">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Text>
            )}
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between mt-6">
            <StatCard title="Total Appointment" value={data?.appointments?.length || 0} />
            <StatCard title="Rating" value={data?.average_rating || "Not rated yet"} />
          </View>

          {/* Consultancy Fee Card */}
          <View className="mt-3 bg-blue-50 p-4 rounded-xl">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-JakartaMedium">Consultancy Fee</Text>
              {isEditing ? (
                <View className="flex-row items-center">
                  <TextInput
                    value={consultancyFees}
                    onChangeText={(text) => {
                      setConsultancyFees(text);
                      updateField('consultancy_fees', parseFloat(text) || 0);
                    }}
                    keyboardType="numeric"
                    className="bg-white px-3 py-1 rounded-lg border border-gray-300 w-24 text-right"
                  />
                  <Text className="ml-2 text-gray-700 font-JakartaMedium">POL</Text>
                </View>
              ) : (
                <Text className="font-JakartaBold text-lg text-blue-700">POL {consultancyFees}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <View className="px-4 mt-6 space-y-6">
        {/* Professional Info Section */}
        <MenuSection
          title="Professional Information"
          items={[
            {
              icon: "medical",
              label: "Specialization",
              value: specialtiesDisplay || "Not specified"
            },
            { icon: "business", label: "Hospital", value: data?.hospital || "Not specified" },
            { icon: "time", label: "Experience", value: data?.experience ? `${data.experience} years` : "Not specified" },
            { icon: "mail", label: "Email", value: data?.email || "Not specified" },
            { icon: "document-text", label: "Qualification", value: data?.qualification || "Not specified" },
            { icon: "information-circle", label: "Bio", value: data?.bio || "Not specified" },
            { icon: "calendar", label: "Available Days", value: data?.available_days?.join(", ") || "Not specified" },
          ]}
          isEditing={isEditing}
          onValueChange={(label, value) => {
            if (label === "Specialization") {
              updateSpecialty(value);
            } else if (label === "Hospital") {
              updateField('hospital', value);
            } else if (label === "Experience") {
              const years = parseInt(value.replace(' years', '')) || 0;
              updateField('experience', years);
            } else if (label === "Email") {
              updateField('email', value);
            } else if (label === "Qualification") {
              updateField('qualification', value);
            } else if (label === "Bio") {
              updateField('bio', value);
            } else if (label === "Available Days") {
              updateField('available_days', value.split(', '));
            }
          }}
        />

        {/* Settings */}
        <MenuSection
          title="Settings"
          items={[
            { icon: "settings", label: "Account Settings" },
            { icon: "shield-checkmark", label: "Privacy" },
            { icon: "help-circle", label: "Help & Support" },
          ]}
          isEditing={false}
        />

        {/* Wallet Connection */}
        <View className="pb-6">
          <Button text="Wallet Info !" onClick={open} />
        </View>
      </View>
      <StatusBar style="dark" />
    </ScrollView>
  );
};

const StatCard = ({ title, value }: { title: String, value: number | string }) => (
  <View className="bg-gray-50 p-4 rounded-xl w-[48%]">
    <Text className="text-gray-500 text-sm font-JakartaMedium ">{title}</Text>
    <Text className="text-xl font-JakartaBold text-gray-800 ">{value}</Text>
  </View>
);

const MenuSection = ({ title, items, isEditing, onValueChange }: MenuSectionProps & {
  isEditing?: boolean;
  onValueChange?: (label: string, value: string) => void;
}) => (
  <View className="p-2">
    <Text className="text-lg font-JakartaBold mb-3 text-gray-800">{title}</Text>
    <View className="bg-white rounded-xl overflow-hidden shadow-sm">
      {items.map((item, index) => (
        <View
          key={index}
          className={`flex-row items-center p-4 ${index < items.length - 1 ? "border-b border-gray-100" : ""}`}
        >
          <Ionicons name={item.icon} size={22} color="#4B5563" />
          <View className="flex-1 ml-3">
            {isEditing && item.value ? (
              <TextInput
                className="text-gray-800 font-Jakarta text-base p-1 border-b border-gray-300"
                defaultValue={item.value.toString()}
                onChangeText={(text) => onValueChange?.(item.label, text)}
              />
            ) : (
              <>
                <Text className="text-gray-800 font-Jakarta text-base">{item.label}</Text>
                {item.value && (
                  <Text className="text-gray-500 text-sm">{item.value}</Text>
                )}
              </>
            )}
          </View>
          {isEditing && item.value && (
            <Ionicons name="create-outline" size={20} color="#4B5563" />
          )}
        </View>
      ))}
    </View>
  </View>
);

export default Account;
