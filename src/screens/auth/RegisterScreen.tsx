import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SocialLoginButton from '../../components/auth/SocialLoginButton';
import { theme } from '../../theme';
import {
  useGoogleAuth,
  useFacebookAuth,
  handleGoogleResponse,
  handleFacebookResponse,
} from '../../services/oauth';

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // OAuth hooks
  const {
    request: googleRequest,
    response: googleResponse,
    promptAsync: promptGoogleAsync,
  } = useGoogleAuth();

  const {
    request: facebookRequest,
    response: facebookResponse,
    promptAsync: promptFacebookAsync,
  } = useFacebookAuth();

  // Handle Google response
  useEffect(() => {
    if (googleResponse) {
      handleGoogleSignup();
    }
  }, [googleResponse]);

  // Handle Facebook response
  useEffect(() => {
    if (facebookResponse) {
      handleFacebookSignup();
    }
  }, [facebookResponse]);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const result = await handleGoogleResponse(googleResponse);
      if (result) {
        await AsyncStorage.setItem('access_token', result.access_token);
        await AsyncStorage.setItem('refresh_token', result.refresh_token);
        Alert.alert('Sucesso', 'Cadastro com Google realizado!');
      }
    } catch (error: any) {
      Alert.alert(
        'Erro no cadastro com Google',
        error.response?.data?.detail || 'Tente novamente'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setFacebookLoading(true);
    try {
      const result = await handleFacebookResponse(facebookResponse);
      if (result) {
        await AsyncStorage.setItem('access_token', result.access_token);
        await AsyncStorage.setItem('refresh_token', result.refresh_token);
        Alert.alert('Sucesso', 'Cadastro com Facebook realizado!');
      }
    } catch (error: any) {
      Alert.alert(
        'Erro no cadastro com Facebook',
        error.response?.data?.detail || 'Tente novamente'
      );
    } finally {
      setFacebookLoading(false);
    }
  };

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

    if (!/[A-Z]/.test(password)) {
      Alert.alert('Erro', 'A senha deve conter pelo menos uma letra maiúscula');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        full_name: fullName,
        email: email.toLowerCase().trim(),
        password,
        city: city || undefined,
      });
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Tente novamente mais tarde';
      
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
            <Ionicons name="person-add" size={60} color={theme.colors.textInverse} />
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se à comunidade PraiaAgora
            </Text>
          </View>

          <View style={styles.form}>
            {/* OAuth Buttons */}
            <SocialLoginButton
              provider="google"
              onPress={() => promptGoogleAsync()}
              disabled={!googleRequest || googleLoading || facebookLoading}
              loading={googleLoading}
            />

            <SocialLoginButton
              provider="facebook"
              onPress={() => promptFacebookAsync()}
              disabled={!facebookRequest || googleLoading || facebookLoading}
              loading={facebookLoading}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou cadastre-se com e-mail</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Registration */}
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
              Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
            </Text>
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
    padding: theme.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: theme.spacing.sm,
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
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  termsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    opacity: 0.8,
  },
});
