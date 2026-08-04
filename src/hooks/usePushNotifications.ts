// src/hooks/usePushNotifications.ts

import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerCurrentPushDevice } from '../services/pushDevices';
import { useAuthStore } from '../store/useAuthStore';
import { useTargetChoirStore } from '../store/useTargetChoirStore';

interface PushNotificationState {
	readonly registered: boolean;
	readonly notification: Notifications.Notification | null;
}

export const usePushNotifications = (): PushNotificationState => {
	const status = useAuthStore((state) => state.status);
	const requiresPasswordChange = useAuthStore((state) => state.requiresPasswordChange);
	const userRole = useAuthStore((state) => state.user?.role);
	const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
	const viewMode = useTargetChoirStore((state) => state.viewMode);
	const [registered, setRegistered] = useState(false);
	const [notification, setNotification] = useState<Notifications.Notification | null>(null);

	useEffect(() => {
		const hasTenantContext = userRole !== 'SUPER_ADMIN' || (
			viewMode === 'tenant' && selectedChoir !== null
		);

		if (status !== 'authenticated' || requiresPasswordChange || !hasTenantContext) {
			setRegistered(false);
			return undefined;
		}

		let active = true;
		const receivedSubscription = Notifications.addNotificationReceivedListener((received) => {
			setNotification(received);
		});
		const tokenSubscription = Notifications.addPushTokenListener(() => {
			registerCurrentPushDevice()
				.then((didRegister) => {
					if (active) {
						setRegistered(didRegister);
					}
				})
				.catch(() => undefined);
		});

		registerCurrentPushDevice()
			.then((didRegister) => {
				if (active) {
					setRegistered(didRegister);
				}
			})
			.catch(() => {
				if (active) {
					setRegistered(false);
				}
			});

		return () => {
			active = false;
			receivedSubscription.remove();
			tokenSubscription.remove();
		};
	}, [requiresPasswordChange, selectedChoir, status, userRole, viewMode]);

	return { registered, notification };
};
