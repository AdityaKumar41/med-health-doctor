export interface FormData {
    name: string;
    email: string;
    age: Number;
    hospital: string;
    experience: string;
    qualification: string;
    bio: string;
    location_lat: string;
    location_lng: string;
    specialties: string[];
    profile_picture: string;
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