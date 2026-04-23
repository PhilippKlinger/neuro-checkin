import { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useTheme';

const SECTIONS = [
  {
    title: 'Was ist ein Check-in?',
    body: 'Ein Check-in ist ein kurzer Moment, in dem du innehältst: Was spüre ich gerade? Was braucht mein Körper? Was geht mir durch den Kopf? Mehr nicht.',
  },
  {
    title: 'Was dir das bringen kann',
    body: 'Manche bemerken dadurch leichter, wann sie eine Pause brauchen — bevor die Erschöpfung zu groß wird.\n\nManche sehen mit der Zeit, dass bestimmte Situationen oder Tage schwerer sind als andere.\n\nManche nutzen es einfach als kleinen Moment nur für sich.',
  },
  {
    title: 'Für wen diese App gedacht ist',
    body: 'Die App ist für Menschen gemacht, die nicht immer leichten Zugang zu ihren Körpersignalen oder Gefühlen haben — zum Beispiel bei Autismus, ADHS, Alexithymie, nach belastenden Erfahrungen oder an erschöpften Tagen.\n\nEine Diagnose brauchst du nicht.',
  },
  {
    title: 'Wie du sie nutzt',
    body: 'Du entscheidest, wie oft. Du entscheidest, wie tief. Jeder Schritt ist freiwillig. Nichts muss perfekt sein. Es gibt keinen richtigen Check-in.\n\nWenn dir der volle Check-in zu viel ist, nimm den Schnell-Check-in — drei Schritte reichen.',
  },
  {
    title: 'Was sie nicht ist',
    body: 'Diese App ist keine Therapie und kein Ersatz dafür. Wenn es dir gerade sehr schlecht geht, sind die Telefonseelsorge (0800 111 0 111, kostenlos und rund um die Uhr) oder deine Hausärztin / dein Hausarzt gute erste Anlaufstellen.\n\nDie App kann begleiten — aber nicht heilen.',
  },
];

export default function CheckInInfoScreen() {
  const { theme, spacing, typography, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: spacing.lg,
          paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
          flexGrow: 1,
        },
        sectionCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        sectionCardLast: {
          backgroundColor: theme.colors.surface,
          borderRadius: radii.md,
          padding: spacing.md,
        },
        sectionTitle: {
          fontFamily: typography.families.heading.semibold,
          fontSize: typography.sizes.md,
          color: theme.colors.text,
          marginBottom: spacing.sm,
        },
        sectionBody: {
          fontFamily: typography.families.body.regular,
          fontSize: typography.sizes.md,
          color: theme.colors.textSecondary,
          lineHeight: typography.sizes.md * 1.6,
        },
      }),
    [theme, spacing, typography, radii, insets.bottom]
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {SECTIONS.map((section, index) => (
        <View
          key={section.title}
          style={index < SECTIONS.length - 1 ? s.sectionCard : s.sectionCardLast}
        >
          <Text style={s.sectionTitle} accessibilityRole="header">
            {section.title}
          </Text>
          <Text style={s.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
