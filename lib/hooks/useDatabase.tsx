import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from '../database/schema';
import { spacing, typography, themes } from '../constants/themes';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const database = openDatabaseSync('neuro-checkin.db');
        await migrateDatabase(database);
        setDb(database);
        setIsReady(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
        setError(message);
      }
    }
    init();
  }, []);

  if (error) {
    // ThemeProvider is unavailable here — use tokens directly from themes.ts
    const colors = themes.warmEarth.colors;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
        <Text style={{ fontSize: typography.sizes.lg, marginBottom: spacing.sm, textAlign: 'center', color: colors.text }}>
          Datenbank konnte nicht geladen werden
        </Text>
        <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): SQLiteDatabase {
  const { db } = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase must be used within DatabaseProvider after initialization');
  }
  return db;
}

export function useDatabaseReady(): boolean {
  const { isReady } = useContext(DatabaseContext);
  return isReady;
}
