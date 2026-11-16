import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { MessageView } from '@/components/states';

/**
 * Platzhalter. Der Scanner ist laut Konzept die erste eigene Bauphase: Erkennung
 * auf dem Gerät aus Bildvergleich und Texterkennung, gemessen an echten Fotos.
 * Bis dahin trägt man Karten im Set per langem Druck ein.
 */
export default function ScanScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <MessageView
        symbol={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' }}
        title="Der Scanner kommt als Nächstes"
        description="Bis dahin: Set öffnen und eine Karte gedrückt halten, um sie einzutragen."
        actionLabel="Zu den Sets"
        onAction={() => {
          router.back();
          router.push('/sets');
        }}
      />
    </View>
  );
}
