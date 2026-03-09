import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { theme } from '../../theme';
// OAuth imports mantidos para uso futuro
// import SocialLoginButton from '../../components/auth/SocialLoginButton';
// import { useGoogleAuth, handleGoogleResponse } from '../../services/oauth';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Google OAuth desabilitado temporariamente (pré-lançamento)
  // const [googleLoading, setGoogleLoading] = useState(false);

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
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="water" size={80} color={theme.colors.textInverse} />
            <Text style={styles.title}>Beachly</Text>
            <Text style={styles.subtitle}>
              Encontre as melhores praias de Santa Catarina
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email/Password Login */}
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

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock-closed"
            />

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />

            <Button
              title="Criar conta"
              variant="ghost"
              onPress={() => navigation.navigate('Register')}
              fullWidth
              style={styles.registerButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textInverse,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
});
