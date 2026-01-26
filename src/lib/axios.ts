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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    // Log error for debugging
    console.error('API Error:', errorMessage);
    
    // Optionally send error to chatbot help
    try {
      await apiClient.post('/api/chatbot/chatbot-help', {
        message: `Error occurred: ${errorMessage}`,
        context: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
        }
      }).catch(() => {
        // Silently fail if chatbot help is unavailable
      });
    } catch {
      // Ignore chatbot errors
    }
    
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
  
  // Apps
  getAllApps: () => apiClient.get('/api/apps/all'),
  getPendingApps: () => apiClient.get('/api/apps/admin/pending'),
  updateAppStatus: (appId: string, status: string) =>
    apiClient.post('/api/apps/update-status', { appId, status }),
  uploadApp: (formData: FormData) => 
    apiClient.post('/api/apps/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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
};

export default apiClient;
