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

// Get all items
export const getAllItems = async (params = {}) => {
  const response = await api.get("/items", { params });
  return response.data;
};

// Get item by ID
export const getItemById = async (id) => {
  const response = await api.get(`/items/${id}`);
  return response.data;
};

// Create item
export const createItem = async (itemData) => {
  const response = await api.post("/items", itemData);
  return response.data;
};

// Update item
export const updateItem = async (id, itemData) => {
  const response = await api.put(`/items/${id}`, itemData);
  return response.data;
};

// Delete item
export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};

// Upload image with Multer
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.post("/uploads/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
