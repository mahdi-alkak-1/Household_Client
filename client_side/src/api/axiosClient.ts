// src/api/axiosClient.ts
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Attach JSON defaults safely
axiosClient.defaults.headers.common["Accept"] = "application/json";
axiosClient.defaults.headers.common["Content-Type"] = "application/json";

// Always attach token to requests
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
