'use client';

import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getSession } from 'next-auth/react';
import Cookies from 'js-cookie'; // Add this import

const axiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async config => {
    // Try to get token from session (Google Sign In)
    const session = await getSession();
    let token = session?.backendToken;

    // If we have a token, add it to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear cookies and session if needed
      Cookies.remove('token');
      // You might want to redirect to login page here
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
