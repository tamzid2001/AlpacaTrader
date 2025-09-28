import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceInfo {
  platform: 'ios' | 'android';
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown';
  screenSize: 'small' | 'medium' | 'large';
  isTablet: boolean;
  hasNotch: boolean;
}

export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const isTablet = Device.deviceType === Device.DeviceType.TABLET;
  
  return {
    platform: Platform.OS as 'ios' | 'android',
    deviceType: isTablet ? 'tablet' : 'phone',
    screenSize: width < 768 ? 'small' : width < 1024 ? 'medium' : 'large',
    isTablet,
    hasNotch: Platform.OS === 'ios' && height >= 812
  };
};