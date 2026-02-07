import axios from 'axios';

// Backend API URL
const API_BASE_URL = 'https://app-store-backend-iodn.onrender.com';

// Static admin token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgxOTIyYjAxLWU1YTgtNGQ2Yi04MWM1LWY2ZTQyYTk2MzlkMiIsImVtYWlsIjoibmF2ZWRhaG1hZDkwMTJAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5MjgxMzczLCJleHAiOjE3Njk4ODYxNzN9.kA4wltUABPJn3IdvXdOFwQt6g04rOg1A_QPxRYuZZ2Y';

// Create Axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach Bearer token to every request
apiClient.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${ADMIN_TOKEN}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
// IMPORTANT: Do NOT call any API inside this interceptor to avoid infinite recursion
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('[API Error]', error.config?.method?.toUpperCase(), error.config?.url, '-', errorMessage);
    return Promise.reject(error);
  }
);

// API Service functions
export const adminAPI = {
  // Dashboard stats
  getStatsSummary: () => apiClient.get('/api/admin/stats/summary'),
  
  // Developers
  getAllDevelopers: () => apiClient.get('/api/developers/all'),
  updateDeveloperStatus: (developerId: string, status: string, reason?: string) => 
    apiClient.post('/api/developers/update-status', { developerId, status, reason }),
  registerDeveloper: (formData: FormData, onUploadProgress?: (progress: number) => void) =>
    apiClient.post('/api/developers/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      }
    }),
  
  // Apps
  getAllApps: () => apiClient.get('/api/apps/all'),
  getPendingApps: () => apiClient.get('/api/apps/admin/pending'),
  updateAppStatus: (appId: string, status: string) =>
    apiClient.post('/api/apps/update-status', { appId, status }),
  uploadApp: (formData: FormData, onUploadProgress?: (progress: number) => void) => 
    apiClient.post('/api/apps/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      }
    }),
  
  // AI Upload
  aiGenerateDescription: (data: { name: string; category: string }) => 
    apiClient.post('/api/ai-upload', data),
  
  // Clone Check
  checkClone: (packageId: string) => 
    apiClient.post('/api/clone-check/clone-check', { package_id: packageId }),
  
  // Virus Scan
  scanForVirus: (appId: string) => 
    apiClient.post('/api/virus-scan', { appId }),
  
  // Chatbot Help
  getChatbotHelp: (message: string) => 
    apiClient.post('/api/chatbot/chatbot-help', { message }),

  // Chatbot with context (for errors)
  getChatbotHelpWithContext: (errorMessage: string, context: string) =>
    apiClient.post('/api/chatbot/chatbot-help', { 
      message: errorMessage, 
      context 
    }),
};

export default apiClient;
