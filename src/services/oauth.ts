/**
 * Serviço de autenticação OAuth (Google)
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import api from './api';

// Necessário para fechar o browser após autenticação
WebBrowser.maybeCompleteAuthSession();

// IDs dos apps OAuth — lidos de variáveis EXPO_PUBLIC_ no arquivo .env
// Consulte .env na raiz do projeto para saber quais valores preencher.
const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '';

// URI de redirecionamento — deve estar cadastrada no Google Cloud Console
// Verifique o log do Metro: "Google redirectUri:" para saber qual adicionar.
const REDIRECT_URI = makeRedirectUri({
  scheme: 'com.beachly.app',
  path: 'oauth2redirect/google',
});

console.log('[OAuth] Google redirectUri:', REDIRECT_URI);

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
    redirectUri: REDIRECT_URI,
  });

  return { request, response, promptAsync };
};

/**
 * Envia o token OAuth para o backend e obtém nossos tokens JWT
 */
export const loginWithOAuth = async (
  provider: 'google',

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

