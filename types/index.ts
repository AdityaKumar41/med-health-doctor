export interface ServiceCardProps {
  bgColor: string;
  title: string;
  description: string;
  imageUri?: string;
  customIcon?: boolean;
  onPress?: () => void | undefined;
}

export interface BannerCardProps {
  bgColor: string;
  title: string;
}

export interface NavItemProps {
  label: string;
  isActive?: boolean;
}

export interface AppointmentButtonProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
}

export interface AppointmentHeaderProps {
  title: string;
  description: string;
}

export interface SpecialtyCardProps {
  emoji: string;
  title: string;
  description: string;
}

export interface SearchBarProps {
  placeholder: string;
}
