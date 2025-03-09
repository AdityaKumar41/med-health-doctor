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
  value: string;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "decimal-pad"
    | undefined;
  onChangeText?: (text: string) => void;
}

// Standardized form data interfaces
export interface FormData {
  fullName: string;
  email: string;
  age: string;
  gender: string;
  bloodGroup: string;
}

export interface FormDataRedg {
  name: string;
  email: string;
  age: number;
  hospital: string;
  experience: number; // Changed from string to number
  qualification: string;
  bio: string;
  specialties: string[];
  profile_picture: string;
  doctor_id: string;
  wallet_address: string;
  consultancy_fees: number;
  // Additional fields can be added here as needed
  [key: string]: any; // This allows for dynamic access to properties
}

export interface FormErrors {
  [key: string]: string;
}

export interface InputDetailType {
  label: string;
  placeholder: string;
  key: string; // Allow any string key that corresponds with FormDataRedg properties
  icon: string;
  keyboardType:
    | "default"
    | "numeric"
    | "email-address"
    | "phone-pad"
    | "decimal-pad";
  secureTextEntry?: boolean;
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

export interface Specialization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ReportSchema {
  patient_id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  report_type: string;
  report_date: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AvailableTime {
  start_time: string;
  end_time: string;
}

// Patient type definition
export interface Patient {
  id: string;
  name: string;
  email: string;
  gender: string;
  age: number;
  wallet_address: string;
  profile_picture: string;
  blood_group: string;
  createdAt: string;
  updatedAt: string;
}

// Ticket type definition
export interface Ticket {
  id: string;
  ticket_number: string;
  appointment_id: string;
  status: string;
  notes: string;
  qr_code: string;
  expires_at: string;
  createdAt: string;
  updatedAt: string;
}

// Appointment data from API
export interface AppointmentData {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: status;
  appointment_fee: number;
  tx_hash: string;
  contract_appointment_id: string | null;
  is_active: boolean;
  amount_paid: number;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  ticket?: Ticket;
}

// Formatted appointment for UI
export interface FormattedAppointment {
  id: string;
  patientName: string;
  appointmentTime: string;
  status: status;
  symptoms: string;
  profilePicture?: string;
  patientDetails?: Patient;
  ticketDetails?: Ticket;
  appointmentDate: Date;
}

// API Response structure
export interface AppointmentApiResponse {
  status: string;
  data: AppointmentData[];
}
export type status = "scheduled" | "cancelled" | "completed" | "pending";

// Medical record types
export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  title: string;
  description: string;
  record_type: "prescription" | "lab_result" | "diagnosis" | "general";
  medication?: string;
  dosage?: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordsResponse {
  status: string;
  data: MedicalRecord[];
}
