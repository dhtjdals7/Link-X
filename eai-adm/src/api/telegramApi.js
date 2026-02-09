import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 전문 목록 조회
export const getTelegramList = () => api.get("/telegram/list");

// 레이아웃 조회
export const getLayout = (telegramId) => api.get(`/telegram/layout/${telegramId}`);
export const getLayoutBySection = (telegramId) => api.get(`/telegram/layout/${telegramId}/section`);

// 전문 빌드/파싱
export const buildPreview = (data) => api.post("/telegram/preview", data);
export const parseTelegram = (data) => api.post("/telegram/parse", data);

// 전문 송수신
export const sendTelegram = (data) => api.post("/telegram/send", data);
export const testConnection = (data) => api.post("/telegram/test-connection", data);

// 이력
export const getRecentHistory = () => api.get("/telegram/history");
export const getHistoryByTelegram = (telegramId, page = 0, size = 20) =>
  api.get(`/telegram/history/${telegramId}`, { params: { page, size } });

// 레이아웃 CRUD
export const createLayout = (data) => api.post("/layout", data);
export const createLayoutBatch = (data) => api.post("/layout/batch", data);
export const updateLayout = (id, data) => api.put(`/layout/${id}`, data);
export const deleteLayout = (id) => api.delete(`/layout/${id}`);

// 접속 프로파일
export const getProfiles = () => api.get("/profile");
export const createProfile = (data) => api.post("/profile", data);
export const updateProfile = (id, data) => api.put(`/profile/${id}`, data);
export const deleteProfile = (id) => api.delete(`/profile/${id}`);

export default api;
