import { TabStack } from '@/components/tab-stack';

/** Die Startseite zeichnet ihren Kopf selbst: Wortmarke links, Profil rechts. */
export default function PortfolioLayout() {
  return <TabStack title="Portfolio" indexOptions={{ headerShown: false }} />;
}
