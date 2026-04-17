import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../lib/hooks/useTheme';
import { useDatabase } from '../../lib/hooks/useDatabase';
import { getCheckIns } from '../../lib/database/checkins';
import { CheckIn } from '../../lib/types/checkin';
import { CheckInCard } from '../../components/history/CheckInCard';
import { spacing } from '../../lib/constants/themes';

export default function HistoryScreen() {
  const { theme, spacing, typography } = useTheme();
  const db = useDatabase();
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setIsLoading(true);
        try {
          const data = await getCheckIns(db);
          setCheckIns(data);
        } catch {
          setCheckIns([]);
        } finally {
          setIsLoading(false);
        }
      }
      load();
    }, [db])
  );

  function handlePress(id: number) {
    router.push(`/history/${id}`);
  }

  const renderItem = useCallback<ListRenderItem<CheckIn>>(
    ({ item }) => <CheckInCard checkIn={item} onPress={() => handlePress(item.id)} />,
    // handlePress uses router which is a stable ref; item.id is part of the item itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
          }}
        >
          Laden...
        </Text>
      </View>
    );
  }

  if (checkIns.length === 0) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.colors.background, padding: spacing.lg },
        ]}
      >
        <Text
          style={{
            fontFamily: typography.families.heading.semibold,
            fontSize: typography.sizes.xl,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          Noch keine Check-ins
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body.regular,
            fontSize: typography.sizes.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Deine Check-ins erscheinen hier, sobald du deinen ersten abgeschlossen hast.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
});
