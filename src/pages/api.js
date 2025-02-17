import axios from 'axios';

// Initialize axios instance
const api = axios.create({
  baseURL: 'https://kk-back-end-kappa.vercel.app/', // https://kk-back-end-kappa.vercel.app/
});

// Function to attach auth headers
export const setAuthHeaders = (userData) => {
  // Eject existing interceptor if needed or reset headers directly
  if (userData) {
    api.defaults.headers.common['user'] = JSON.stringify({
      _id: userData._id,
      name: userData.name,
    });
    if (userData.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  } else {
    delete api.defaults.headers.common['user'];
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor (for other URL checks)
api.interceptors.request.use(
  (config) => {
    // Check if the URL is Cloudinary or Google, then remove auth headers.
    if (
      config.url === 'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload' ||
      config.url === 'https://script.google.com/macros/s/AKfycbzroBYkyoKev_IxlEum8cRIt4UTNkE2A9hyLCtzlcRjLNpxI57oHogqa0FB-gcD8ra43A/exec'
    ) {
      delete config.headers.user;
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const fetcher = (url) => api.get(url).then((res) => res.data);

export default api;
