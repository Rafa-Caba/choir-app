// src/hooks/usePushNotifications.ts

import { useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
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
	const userId = useAuthStore((state) => state.user?.id ?? null);
	const userRole = useAuthStore((state) => state.user?.role);
	const userChoirId = useAuthStore((state) => state.user?.choirId ?? null);
	const targetChoirId = useTargetChoirStore((state) => state.selectedChoir?.id ?? null);
	const viewMode = useTargetChoirStore((state) => state.viewMode);
	const [registered, setRegistered] = useState(false);
	const [notification, setNotification] = useState<Notifications.Notification | null>(null);
	const tenantChoirId = userRole === 'SUPER_ADMIN' ? targetChoirId : userChoirId;
	const registrationKey = useMemo(
		() => `${userId ?? 'none'}:${tenantChoirId ?? 'none'}:${viewMode}`,
		[tenantChoirId, userId, viewMode]
	);

	useEffect(() => {
		const receivedSubscription = Notifications.addNotificationReceivedListener(setNotification);
		return () => receivedSubscription.remove();
	}, []);

	useEffect(() => {
		const hasTenantContext = userRole !== 'SUPER_ADMIN' || (
			viewMode === 'tenant' && tenantChoirId !== null
		);

		if (status !== 'authenticated' || requiresPasswordChange || !hasTenantContext) {
			setRegistered(false);
			return undefined;
		}

		let active = true;
		const register = (): void => {
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
		};
		const tokenSubscription = Notifications.addPushTokenListener(register);
		const interactionTask = InteractionManager.runAfterInteractions(register);

		return () => {
			active = false;
			interactionTask.cancel();
			tokenSubscription.remove();
		};
	}, [registrationKey, requiresPasswordChange, status, tenantChoirId, userRole, viewMode]);

	return { registered, notification };
};
