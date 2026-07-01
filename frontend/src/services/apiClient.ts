import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds (for longer model generations)
});

// Request interceptor: add authentication token if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

let isBackendDown = false;

// Response interceptor: retry logic and structured error handling
apiClient.interceptors.response.use(
  (response) => {
    // If a request succeeds, reset the backend down flag
    isBackendDown = false;
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // If no config is present or retry is disabled, reject early
    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry state
    config.retryCount = config.retryCount || 0;

    // Check if we should retry (network error, timeout, or server 5xx error)
    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;

    // If we already detected the backend is down, do not retry
    if (isBackendDown && isNetworkError) {
      error.message = "Unable to connect to the server. Please check if the backend is running.";
      return Promise.reject(error);
    }

    const isSafeRequest = (config.method || "get").toLowerCase() === "get";
    if (isSafeRequest && (isNetworkError || isServerError) && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      console.warn(`[API Retry] Retrying request ${config.url} (${config.retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms...`);
      
      // Backoff delay
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      
      // Return the re-invocation promise
      return apiClient(config);
    }

    if (isNetworkError) {
      isBackendDown = true;
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }

    let errorMessage = "An unexpected error occurred.";
    if (error.response) {
      // Server responded with non-2xx code
      errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
    } else if (error.request) {
      // Request made but no response received
      errorMessage = "Unable to connect to the server. Please check if the backend is running.";
    } else {
      errorMessage = error.message;
    }
    
    console.error("API error details:", error);
    // Attach error message to error object for display in hooks
    error.message = errorMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
