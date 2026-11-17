import { NativeTabs } from 'expo-router/native-tabs';

import { usePalette } from '@/theme/use-palette';

/**
 * Tab-Leiste des Systems. Auf iOS ist das die echte UITabBar mit dem Material
 * und Verhalten der jeweiligen iOS-Version, auf Android die Material-Leiste.
 *
 * Fünf Tabs wie im Moodboard: Portfolio, Sammlung, Scan, Markt, Profil. Das
 * Scan-Symbol ist ein Kreis im Holo-Verlauf mit Kamera und wird auf iOS in
 * Originalfarben gezeichnet ("original"), damit es sich abhebt.
 */
export default function AppTabs() {
  const colors = usePalette();
  const scanIcon = require('@/assets/images/tabs/scan.png');
  return (
    <NativeTabs tintColor={colors.tint}>
      <NativeTabs.Trigger name="(portfolio)">
        <NativeTabs.Trigger.Label>Portfolio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.xyaxis.line" md="show_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sammlung">
        <NativeTabs.Trigger.Label>Sammlung</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }} md="collections" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: scanIcon, selected: scanIcon }} renderingMode="original" md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="markt">
        <NativeTabs.Trigger.Label>Markt</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'storefront', selected: 'storefront.fill' }} md="storefront" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
