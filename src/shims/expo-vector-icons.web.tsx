import React from 'react';
import {
  CloudUpload,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Volume2,
  ChevronRight,
  Music,
  Disc,
  Image as ImageIcon,
} from 'lucide-react';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  [key: string]: any;
}

export function Ionicons({ name, size = 24, color = '#FFFFFF', style, ...props }: IconProps) {
  const map: Record<string, React.ComponentType<any>> = {
    'cloud-upload-outline': CloudUpload,
    'close': X,
    'checkmark-circle': CheckCircle2,
    'alert-circle-outline': AlertCircle,
    'phone-portrait-outline': Smartphone,
    'volume-high-outline': Volume2,
    'chevron-forward': ChevronRight,
    'musical-note': Music,
  };

  const IconComponent = map[name] || Music;
  return <IconComponent color={color} size={size} style={style} {...props} />;
}

export function FontAwesome({ name, size = 24, color = '#FFFFFF', style, ...props }: IconProps) {
  const map: Record<string, React.ComponentType<any>> = {
    'music': Music,
  };

  const IconComponent = map[name] || Music;
  return <IconComponent color={color} size={size} style={style} {...props} />;
}

export function MaterialIcons({ name, size = 24, color = '#FFFFFF', style, ...props }: IconProps) {
  const map: Record<string, React.ComponentType<any>> = {
    'album': Disc,
    'photo-library': ImageIcon,
  };

  const IconComponent = map[name] || Music;
  return <IconComponent color={color} size={size} style={style} {...props} />;
}
