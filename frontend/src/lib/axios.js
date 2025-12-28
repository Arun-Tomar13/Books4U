import axios from 'axios';

const axiosInstance = axios.create({
    baseURL:'http://localhost:8000',
    withCredentials: true,
})

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If access token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Ask backend for a new access token
        await axiosInstance.post("/auth/refresh-token");

        // Retry old request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
            console.log("Refresh token failed");
            if (refreshError.response?.status === 401) {
            // refresh token also expired
            window.location.href = "/login";
      }
    }
}

    return Promise.reject(error);
  }
);
