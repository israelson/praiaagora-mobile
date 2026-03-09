/**
 * Serviço de autenticação OAuth (Google)
 *
 * Para Expo Go: usa expo-auth-session com proxy auth.expo.io.
 * Redirect URI: https://auth.expo.io/@israelsondias/beachly-mobile
 * → Cadastrar esse URI no Web Client do Google Console em:
 *   Authorized redirect URIs → + ADD URI
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import api from './api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '';

// Para build nativo: redirect URI reverse-client-id gerado automaticamente
const _prefix = GOOGLE_ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '');
export const REDIRECT_URI = makeRedirectUri({
  native: `com.googleusercontent.apps.${_prefix}:/oauth2redirect/google`,
});

console.log('[OAuth] redirectUri:', REDIRECT_URI);

export interface OAuthLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: REDIRECT_URI,
  });
  return { request, response, promptAsync };
};

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



