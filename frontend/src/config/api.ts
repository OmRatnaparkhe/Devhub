// Dynamic backend URL based on environment
export const getBackendUrl = () => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    return import.meta.env.VITE_BACKEND_URL_DEV || 'http://localhost:3000/';
  } else {
    return import.meta.env.VITE_BACKEND_URL_PROD || 'https://your-backend-url.onrender.com/';
  }
};

export const backendUrl = getBackendUrl();
