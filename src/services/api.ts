import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL - Update this with your backend URL
const API_BASE_URL = 'http://76.13.232.232:8000'; // VPS IP

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased to 30s for larger responses
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                refresh_token: refreshToken,
              });
              
              const { access_token } = response.data;
              await AsyncStorage.setItem('access_token', access_token);
              
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/api/v1/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    city?: string;
  }) {
    const response = await this.api.post('/api/v1/auth/register', data);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/api/v1/auth/logout');
    return response.data;
  }

  // Beach endpoints
  async getBeaches(params?: {
    city?: string;
    status?: string;
    has_lifeguard?: boolean;
    has_infrastructure?: boolean;
    activities?: string; // Ex: "SURF,FAMILY,KITESURF"
    limit?: number;
    offset?: number;
  }) {
    const response = await this.api.get('/api/v1/beaches', { params });
    return response.data;
  }

  async getBeachById(id: string) {
    const response = await this.api.get(`/api/v1/beaches/${id}`);
    return response.data;
  }

  async getBeachConditions(id: string) {
    // Busca condições via recomendações com GPS fake perto da praia
    // Isso garante que teremos os dados de ICP e condições
    try {
      const beach = await this.getBeachById(id);
      const response = await this.api.get('/api/v1/analytics/beaches/recommend', {
        params: {
          lat: beach.latitude,
          lon: beach.longitude,
          radius: 1, // 1km de raio
          limit: 1
        }
      });
      
      // Retorna a primeira recomendação (a própria praia)
      return response.data.recommendations?.[0] || null;
    } catch (error) {
      console.error('Error fetching beach conditions:', error);
      return null;
    }
  }

  async getNearbyBeaches(latitude: number, longitude: number, radius_km: number = 50) {
    const response = await this.api.get('/api/v1/analytics/beaches/nearby', {
      params: { lat: latitude, lon: longitude, radius: radius_km, limit: 10 },
    });
    return response.data;
  }

  // Check-in endpoints
  async createCheckIn(beachId: string, data: {
    crowd_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  }) {
    const response = await this.api.post(`/api/v1/beaches/${beachId}/checkin`, data);
    return response.data;
  }

  async getMyCheckIns() {
    const response = await this.api.get('/api/v1/checkins/me');
    return response.data;
  }

  // Favorites endpoints
  async addFavorite(beachId: string) {
    const response = await this.api.post(`/api/v1/users/me/favorites/${beachId}`);
    return response.data;
  }

  async removeFavorite(beachId: string) {
    const response = await this.api.delete(`/api/v1/users/me/favorites/${beachId}`);
    return response.data;
  }

  async getFavorites() {
    const response = await this.api.get('/api/v1/users/me/favorites');
    return response.data;
  }

  // Crowd intelligence endpoints
  async getCrowdPrediction(beachId: string, date?: string) {
    const response = await this.api.get(`/api/v1/beaches/${beachId}/crowd/prediction`, {
      params: { date },
    });
    return response.data;
  }

  async getCrowdHistory(beachId: string, days: number = 7) {
    const response = await this.api.get(`/api/v1/beaches/${beachId}/crowd/history`, {
      params: { days },
    });
    return response.data;
  }

  // Partners endpoints
  async getNearbyPartners(beachId: string, radius_km: number = 5) {
    const response = await this.api.get(`/api/v1/beaches/${beachId}/partners/nearby`, {
      params: { radius_km },
    });
    return response.data;
  }

  async getPartnerById(partnerId: number) {
    const response = await this.api.get(`/api/v1/partners/${partnerId}`);
    return response.data;
  }

  // Recommendations endpoint
  async getRecommendations(latitude?: number, longitude?: number, radius_km: number = 30, limit: number = 10) {
    const params: any = { limit };
    if (latitude !== undefined && longitude !== undefined) {
      params.lat = latitude;
      params.lon = longitude;
      params.radius = radius_km;
    }
    const response = await this.api.get('/api/v1/analytics/beaches/recommend', { params });
    return response.data;
  }

  // User profile endpoints
  async getProfile() {
    const response = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async updateProfile(data: {
    full_name?: string;
    city?: string;
    fcm_token?: string;
  }) {
    const response = await this.api.patch('/api/v1/auth/me', data);
    return response.data;
  }

  async getUserStats() {
    const response = await this.api.get('/api/v1/users/me/checkins/summary');
    return response.data;
  }

  // OAuth login helper
  async oauthLogin(provider: string, access_token: string) {
    const response = await this.api.post('/api/v1/auth/oauth/login', {
      provider,
      access_token,
    });
    return response.data;
  }

  // Notifications endpoint
  async registerFCMToken(token: string) {
    const response = await this.api.post('/api/v1/notifications/register', {
      fcm_token: token,
    });
    return response.data;
  }

  // Balneability endpoints
  async getBalneabilityReport() {
    const response = await this.api.get('/api/v1/balneability/report');
    return response.data;
  }

  // Crowd endpoints
  async getCrowdLevel(beachId: string, forceUpdate: boolean = false) {
    const response = await this.api.get(`/api/v1/crowd/beaches/${beachId}/crowd`, {
      params: { force_update: forceUpdate }
    });
    return response.data;
  }

  async createAutoCheckin(beachId: string, latitude: number, longitude: number) {
    const response = await this.api.post(`/api/v1/crowd/beaches/${beachId}/checkin`, null, {
      params: {
        user_lat: latitude,
        user_lon: longitude
      }
    });
    return response.data;
  }
}

export default new ApiService();
