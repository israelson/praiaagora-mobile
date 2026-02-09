import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/ui/Card';
import { theme } from '../../theme';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Privacidade</Text>
        <Text style={styles.paragraph}>
          Este é um espaço para explicar como o PraiaAgora trata seus dados. Dados de localização
          e check-ins são usados para estimativas de lotação e não são compartilhados publicamente
          com informações pessoais.
        </Text>
        <Text style={styles.paragraph}>
          Você pode solicitar exclusão de dados entrando em contato com a equipe através do e-mail no app.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  card: { padding: theme.spacing.md },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, marginBottom: theme.spacing.sm },
  paragraph: { color: theme.colors.textSecondary, lineHeight: 20, marginBottom: theme.spacing.sm },
});
