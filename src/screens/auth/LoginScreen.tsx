import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SocialLoginButton from '../../components/auth/SocialLoginButton';
import { theme } from '../../theme';
import {
  useGoogleAuth,
  handleGoogleResponse,
} from '../../services/oauth';

// Default until GPS resolves a region — today's main market, kept as a
// sane fallback if location is denied/unavailable.
const DEFAULT_STATE_NAME = 'Santa Catarina';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [stateName, setStateName] = useState(DEFAULT_STATE_NAME);

  // Tagline follows the user's own state via GPS + reverse geocoding, so it
  // reads correctly as Beachly expands beyond SC/CE without further changes.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync(position.coords);
        if (address?.region) setStateName(address.region);
      } catch (e) {
        console.warn('State detection error', e);
      }
    })();
  }, []);

  // OAuth hooks
  const {
    request: googleRequest,
    response: googleResponse,
    promptAsync: promptGoogleAsync,
  } = useGoogleAuth();

  // Handle Google response
  useEffect(() => {
    if (googleResponse) {
      handleGoogleLogin();
    }
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await handleGoogleResponse(googleResponse);
      if (result) {
        // Salvar tokens
        await AsyncStorage.setItem('access_token', result.access_token);
        await AsyncStorage.setItem('refresh_token', result.refresh_token);
        // O AuthContext vai detectar e atualizar
        Alert.alert('Sucesso', 'Login com Google realizado!');
      }
    } catch (error: any) {
      Alert.alert(
        'Erro no login com Google',
        error.response?.data?.detail || 'Tente novamente'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

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
            <Image source={require('../../../assets/play-store-icon.png')} style={styles.logo} />
            <Text style={styles.title}>Beachly</Text>
            <Text style={styles.subtitle}>
              Encontre as melhores praias de {stateName}
            </Text>
          </View>

          <View style={styles.form}>
            {/* OAuth Buttons */}
            <SocialLoginButton
              provider="google"
              onPress={() => promptGoogleAsync()}
              disabled={!googleRequest || googleLoading}
              loading={googleLoading}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

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
              secureTextEntry
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
  logo: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.lg,
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
