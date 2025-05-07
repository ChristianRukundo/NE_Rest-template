import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
console.log("API Base URL:", API_URL);

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all transactions
export const getAllTransactions = async (params = {}) => {
  const response = await api.get("/transactions", { params });
  return response.data;
};

// Get transaction by ID
export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

// Create transaction (non-sale types)
export const createTransaction = async (data) => {
  const response = await api.post("/transactions", data);
  return response.data;
};

// Verify blockchain transaction
export const verifyBlockchainTransaction = async (id) => {
  const response = await api.get(`/transactions/${id}/verify-blockchain`);
  return response.data;
};

export const getItemTransactions = async () => {
  return null;
};
// Get user's own transactions
export const getUserTransactions = async (params = {}) => {
  const response = await api.get("/users/me/transactions", { params });
  return response.data;
};




