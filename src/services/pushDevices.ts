// src/services/pushDevices.ts

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import choirApi from '../api/choirApi';
import { getOrCreateDeviceId } from './deviceIdentity';

interface RegisterPushDevicePayload {
    readonly deviceId: string;
    readonly expoPushToken: string;
    readonly platform: 'IOS' | 'ANDROID';
    readonly deviceName?: string;
    readonly appVersion?: string;
}

export const registerCurrentPushDevice = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !Device.isDevice) {
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Notificaciones generales',
            importance: Notifications.AndroidImportance.MAX
        });
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    const permission = currentPermission.status === 'granted'
        ? currentPermission
        : await Notifications.requestPermissionsAsync();

    if (permission.status !== 'granted') {
        return false;
    }

    const projectId = Constants.easConfig?.projectId;

    if (!projectId) {
        return false;
    }

    const [deviceId, tokenResponse] = await Promise.all([
        getOrCreateDeviceId(),
        Notifications.getExpoPushTokenAsync({ projectId })
    ]);
    const payload: RegisterPushDevicePayload = {
        deviceId,
        expoPushToken: tokenResponse.data,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        deviceName: Device.deviceName ?? undefined,
        appVersion: Constants.expoConfig?.version
    };

    await choirApi.post('/push-devices', payload);
    return true;
};
