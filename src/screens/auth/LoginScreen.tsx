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

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.toLowerCase().trim(), password);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Verifique suas credenciais e tente novamente';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => err.msg || err.message).join('\n');
      }

      Alert.alert('Erro ao fazer login', errorMessage);
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
          <Ionicons name="water" size={36} color="rgba(255,255,255,0.9)" style={styles.brandIcon} />
          <Text style={styles.brandName}>Beachly</Text>
          <Text style={styles.brandTagline}>Viva o melhor do litoral</Text>
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
            <Text style={styles.cardTitle}>Entrar na conta</Text>

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail"
            />

            <View style={styles.passwordRow}>
              <Input
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon="lock-closed"
              />
              <TouchableOpacity
                style={styles.showPasswordBtn}
                onPress={() => setShowPassword(v => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>não tem conta?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Criar conta gratuita"
              variant="outline"
              onPress={() => navigation.navigate('Register')}
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
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 0,
  },
  brandIcon: {
    marginBottom: 4,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 54,
  },
  brandTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.8,
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
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  passwordRow: {
    position: 'relative',
  },
  showPasswordBtn: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
    padding: 4,
    zIndex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
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
