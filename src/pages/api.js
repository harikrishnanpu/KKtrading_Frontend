import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

export const setAuthHeaders = (userData) => {
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

api.interceptors.request.use(
  (config) => {
    if (
      config.url === 'https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload' ||
      config.url === 'https://script.google.com/macros/s/AKfycbzroBYkyoKev_IxlEum8cRIt4UTNkE2A9hyLCtzlcRjLNpxI57oHogqa0FB-gcD8ra43A/exec'
    ) {
      delete config.headers.user;
      delete config.headers.Authorization;
    } 

    const accessToken = localStorage.getItem('serviceToken');

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export const fetcher = (url) => api.get(url).then((res) => res.data);

export default api;
