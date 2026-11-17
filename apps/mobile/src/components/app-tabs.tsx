import { NativeTabs } from 'expo-router/native-tabs';

import { usePalette } from '@/theme/use-palette';

/**
 * Tab-Leiste des Systems. Auf iOS ist das die echte UITabBar mit dem Material
 * und Verhalten der jeweiligen iOS-Version, auf Android die Material-Leiste.
 *
 * Fünf Tabs, der Scanner in der Mitte. Sein Symbol ist ein farbiger Kreis mit
 * Kamera und wird auf iOS in Originalfarben gezeichnet ("original"), damit es
 * sich von den übrigen, einfarbigen Symbolen abhebt.
 */
export default function AppTabs() {
  const colors = usePalette();
  const scanIcon = require('@/assets/images/tabs/scan.png');
  return (
    <NativeTabs tintColor={colors.tint}>
      <NativeTabs.Trigger name="(sammlung)">
        <NativeTabs.Trigger.Label>Sammlung</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }} md="collections" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sets">
        <NativeTabs.Trigger.Label>Sets</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="style" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Scannen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: scanIcon, selected: scanIcon }} renderingMode="original" md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="suche">
        <NativeTabs.Trigger.Label>Suche</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
