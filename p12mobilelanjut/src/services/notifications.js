import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let configured = false;

export async function configureNotifications() {
  if (configured) return true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  configured = finalStatus === 'granted';
  return configured;
}

export async function notifyIncomingChat({ senderName, senderId, text }) {
  const canNotify = await configureNotifications();
  if (!canNotify) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Pesan baru dari ${senderName}`,
      body: text || 'Mengirim foto',
      data: {
        url: `p12mobilelanjut://chat/${senderId}`,
      },
    },
    trigger: null,
  });
}
