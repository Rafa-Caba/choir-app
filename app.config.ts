// app.config.ts

import 'dotenv/config';

const readOptionalEnvironmentValue = (name: string): string | undefined => {
    const value = process.env[name]?.trim();
    return value || undefined;
};

const easBuildProfile = readOptionalEnvironmentValue('EAS_BUILD_PROFILE');
const iosBundleIdentifier = readOptionalEnvironmentValue('IOS_BUNDLE_IDENTIFIER');

if (easBuildProfile && !iosBundleIdentifier) {
    throw new Error(
        'IOS_BUNDLE_IDENTIFIER is required for EAS builds. Configure it in the selected EAS environment.'
    );
}

export default {
    expo: {
        name: 'Choir App',
        slug: 'choir-app',
        version: '1.0.4',
        orientation: 'portrait',
        icon: './assets/icon.png',
        scheme: 'choirapp',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        runtimeVersion: {
            policy: 'appVersion'
        },
        updates: {
            url: 'https://u.expo.dev/453ab38a-8f9e-4c53-8ac8-9ed975e6415a'
        },
        splash: {
            image: './assets/splash-icon.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff'
        },
        ios: {
            ...(iosBundleIdentifier ? { bundleIdentifier: iosBundleIdentifier } : {}),
            supportsTablet: true,
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSMicrophoneUsageDescription: 'Permitir a Choir App acceder al micrófono para grabar notas de voz.',
                NSPhotoLibraryUsageDescription: 'Permitir a Choir App acceder a tus fotos para compartirlas en el chat.',
                NSCameraUsageDescription: 'Permitir a Choir App acceder a tu cámara.'
            }
        },
        android: {
            package: 'com.rafacaba.choirapp',
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff'
            }
        },
        web: {
            favicon: './assets/favicon.png'
        },
        extra: {
            eas: {
                projectId: '453ab38a-8f9e-4c53-8ac8-9ed975e6415a'
            },
            localIp: process.env.LOCAL_IP,
            port: process.env.PORT
        },
        plugins: [
            'expo-font',
            'expo-secure-store',
            'expo-notifications',
            [
                'expo-image-picker',
                {
                    photosPermission: 'Permitir a Choir App acceder a tus fotos para compartirlas en el chat y la galería.',
                    cameraPermission: 'Permitir a Choir App acceder a tu cámara.'
                }
            ],
            [
                'expo-av',
                {
                    microphonePermission: 'Permitir a Choir App acceder al micrófono para grabar notas de voz.'
                }
            ],
            'expo-document-picker'
        ]
    }
};
