import { TouchableOpacity, Text, TextStyle, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  textStyle,
  disabled = false,
  ...props 
}: ButtonProps) {
  const buttonStyle: ViewStyle = {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: variant === 'primary' ? '#3b82f6' : '#e5e7eb',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const buttonTextStyle: TextStyle = {
    textAlign: 'center',
    fontWeight: '600',
    color: variant === 'primary' ? '#ffffff' : '#374151',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
}