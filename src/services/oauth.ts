/**
 * Serviço de autenticação OAuth (Google, Facebook)
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import api from './api';

// Necessário para fechar o browser após autenticação
WebBrowser.maybeCompleteAuthSession();

// IDs dos apps OAuth — lidos das variáveis de ambiente (EXPO_PUBLIC_* no .env)
const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

// Facebook OAuth: preencha EXPO_PUBLIC_FACEBOOK_APP_ID no .env se utilizar
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

export interface OAuthLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

/**
 * Hook para login com Google
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};

/**
 * Hook para login com Facebook
 */
export const useFacebookAuth = () => {
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri: makeRedirectUri({
      scheme: 'beachly'
    }),
  });

  return { request, response, promptAsync };
};

/**
 * Envia o token OAuth para o backend e obtém nossos tokens JWT
 */
export const loginWithOAuth = async (
  provider: 'google' | 'facebook',
  accessToken: string
): Promise<OAuthLoginResponse> => {
  try {
    const data = await api.oauthLogin(provider, accessToken);
    return data as OAuthLoginResponse;
  } catch (error: any) {
    console.error('OAuth login error:', error.response?.data || error);
    throw error;
  }
};

/**
 * Processa a resposta do Google e faz login no backend
 */
export const handleGoogleResponse = async (
  response: any
): Promise<OAuthLoginResponse | null> => {
  if (response?.type === 'success') {
    const { authentication } = response;
    if (authentication?.accessToken) {
      return await loginWithOAuth('google', authentication.accessToken);
    }
  }
  return null;
};

/**
 * Processa a resposta do Facebook e faz login no backend
 */
export const handleFacebookResponse = async (
  response: any
): Promise<OAuthLoginResponse | null> => {
  if (response?.type === 'success') {
    const { authentication } = response;
    if (authentication?.accessToken) {
      return await loginWithOAuth('facebook', authentication.accessToken);
    }
  }
  return null;
};
