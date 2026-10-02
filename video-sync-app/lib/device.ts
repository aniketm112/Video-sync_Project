import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'videosync.deviceId';

export type DeviceInfo = {
  deviceId: string;
  deviceName: string;
};

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function deviceDisplayName(): string {
  return Platform.select({
    ios: 'iOS app',
    android: 'Android app',
    web: 'Web app',
    default: 'App',
  });
}

let cached: DeviceInfo | null = null;

/** Stable per-install device identity, used to tag pushed videos. */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (cached) return cached;

  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = randomId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  cached = { deviceId, deviceName: deviceDisplayName() };
  return cached;
}
