import axios from 'axios';

const API_BASE = '/api/simulator';

const simulatorApi = {
  // ===== 리스너 제어 =====
  startListener: (configId) => axios.post(`${API_BASE}/listener/${configId}/start`),
  stopListener: (configId) => axios.post(`${API_BASE}/listener/${configId}/stop`),
  getListenerStatuses: () => axios.get(`${API_BASE}/listener/status`),
  stopAll: () => axios.post(`${API_BASE}/listener/stop-all`),

  // ===== 설정 CRUD =====
  getAllConfigs: () => axios.get(`${API_BASE}/config`),
  getConfig: (id) => axios.get(`${API_BASE}/config/${id}`),
  saveConfig: (config) => axios.post(`${API_BASE}/config`, config),
  updateConfig: (id, config) => axios.put(`${API_BASE}/config/${id}`, config),
  deleteConfig: (id) => axios.delete(`${API_BASE}/config/${id}`),

  // ===== 응답 규칙 =====
  getRules: (telegramId) => axios.get(`${API_BASE}/rule/${telegramId}`),
  getConfiguredTelegramIds: () => axios.get(`${API_BASE}/rule/telegram-ids`),
  saveRule: (rule) => axios.post(`${API_BASE}/rule`, rule),
  saveRules: (rules) => axios.post(`${API_BASE}/rule/batch`, rules),
  deleteRule: (ruleId) => axios.delete(`${API_BASE}/rule/${ruleId}`),
  deleteRulesByTelegramId: (telegramId) => axios.delete(`${API_BASE}/rule/telegram/${telegramId}`),

  // ===== 로그 =====
  getRecentLogs: () => axios.get(`${API_BASE}/log`),
  getLogsByConfig: (configId) => axios.get(`${API_BASE}/log/config/${configId}`),
  getLogsByTelegram: (telegramId) => axios.get(`${API_BASE}/log/telegram/${telegramId}`),
};

export default simulatorApi;
