import { NativeTabs } from 'expo-router/native-tabs';

import { usePalette } from '@/theme/use-palette';

/**
 * Tab-Leiste des Systems. Auf iOS ist das die echte UITabBar mit dem Material
 * und Verhalten der jeweiligen iOS-Version, auf Android die Material-Leiste.
 *
 * Vier Tabs, jeder ein eigener Bereich. Der Scanner ist bewusst kein Tab: Die
 * Richtlinien sehen die Tab-Leiste für Navigation vor, nicht für Aktionen. Er
 * sitzt als Taste in der Navigationsleiste der Sammlung.
 */
export default function AppTabs() {
  const colors = usePalette();
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
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
      {/* Die Rolle "search" stellt den Tab auf iOS 26 als eigenen Such-Tab dar. */}
      <NativeTabs.Trigger name="suche" role="search">
        <NativeTabs.Trigger.Label>Suche</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
