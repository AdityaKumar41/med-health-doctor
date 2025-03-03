import { IconProps } from "@expo/vector-icons/build/createIconSet";

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
  placeholder: string;
  value: string,
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | undefined;
  onChangeText?: (text: string) => void;
}

export interface FormData {
  fullName: string;
  email: string;
  age: string;
  gender: string;
  bloodGroup: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface InputDetailType {
  label: string;
  placeholder: string;
  key: keyof FormData;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | undefined;
}

export interface SpecialtyCardProps {
  emoji: string;
  title: string;
  description: string;
}

export interface SearchBarProps {
  placeholder: string;
}


export interface DoctorProps {
  name: string;
  specialty: string;
  price: string;
  rating: string;
  imageUrl: string;
}

export interface SearchBarProps {
  placeholder: string;
}

export interface FilterButtonProps {
  label: string;
}

export interface MenuItem {
  icon: IconProps;
  label: string;
  value?: string;
}

export interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

export interface MenuSectionProps {
  title: string;
  items: {
    icon: any;
    label: string;
    value?: string | number;
  }[];
  isEditing?: boolean;
  onValueChange?: (label: string, value: string) => void;
}

export interface AppointmentProps {
  name: string;
  specialty: string;
  date: string;
  image?: string;
}

export interface AppointmentSchema {
  patient_id: string;
  doctor_id: string;
  date: string;
  appointment_fee: string;
  amount_paid: string;
  ticket_notes: string;
}

export interface FormData {
  name: string;
  email: string;
  age: Number;
  hospital: string;
  experience: string;
  qualification: string;
  bio: string;
  doctor_id: string;
  location_lat: string;
  location_lng: string;
  specialties: string[];
  profile_picture: string;
  consultancy_fees: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface InputDetailType {
  label: string;
  placeholder: string;
  key: keyof FormData;
  icon: string;
  keyboardType: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
}

export interface Specialization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}


export interface MenuSectionProps {
  title: string;
  items: {
    icon: any;
    label: string;
    value?: string | number;
  }[];
  isEditing?: boolean;
  onValueChange?: (label: string, value: string) => void;
}