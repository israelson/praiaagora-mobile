import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { theme } from '../../theme';

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp({ full_name: fullName, email: email.toLowerCase().trim(), password, city });
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Não foi possível criar a conta';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => err.msg || err.message).join('\n');
      }

      Alert.alert('Erro ao criar conta', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Header com gradiente e marca ── */}
      <LinearGradient
        colors={['#9ECFDF', '#1BADB0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Ionicons name="water" size={28} color="rgba(255,255,255,0.9)" style={styles.brandIcon} />
          <Text style={styles.brandName}>Beachly</Text>
          <Text style={styles.brandTagline}>Crie sua conta gratuita</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Card branco (formulário) ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Input
              label="Nome Completo *"
              placeholder="Seu nome"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              icon="person"
            />

            <Input
              label="E-mail *"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail"
            />

            <Input
              label="Cidade"
              placeholder="Ex: Florianópolis"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              icon="location"
            />

            <Input
              label="Senha *"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed"
            />

            <Input
              label="Confirmar Senha *"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon="lock-closed"
            />

            <Button
              title="Criar Conta"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="large"
            />

            <Text style={styles.termsText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>já tem conta?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Fazer login"
              variant="outline"
              onPress={() => navigation.goBack()}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingBottom: 36,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 0,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: Platform.OS === 'ios' ? 12 : 10,
    padding: theme.spacing.sm,
    zIndex: 1,
  },
  brandIcon: {
    marginBottom: 2,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 44,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.6,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  cardWrapper: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  termsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
});
