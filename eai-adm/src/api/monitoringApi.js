import axios from "axios";

const api = axios.create({
  baseURL: "/api/monitor",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/**
 * SSE 스트림 연결
 * @param {function} onLog - 개별 로그 이벤트 콜백
 * @param {function} onStats - 통계 갱신 이벤트 콜백
 * @param {function} onInit - 초기 데이터 콜백
 * @returns {EventSource} 연결 해제 시 .close() 호출
 */
export const connectMonitorStream = (onLog, onStats, onInit) => {
  const es = new EventSource("/api/monitor/stream");

  es.addEventListener("init", (e) => {
    try { onInit && onInit(JSON.parse(e.data)); }
    catch (err) { console.error("init 파싱 에러:", err); }
  });

  es.addEventListener("log", (e) => {
    try { onLog && onLog(JSON.parse(e.data)); }
    catch (err) { console.error("log 파싱 에러:", err); }
  });

  es.addEventListener("stats", (e) => {
    try { onStats && onStats(JSON.parse(e.data)); }
    catch (err) { console.error("stats 파싱 에러:", err); }
  });

  es.onerror = (e) => {
    console.warn("SSE 연결 에러 - 재연결 시도 중...");
  };

  return es;
};

/** 현재 통계 스냅샷 (폴링 fallback) */
export const getStats = () => api.get("/stats");

/** 최근 로그 (초기 로드) */
export const getRecentLogs = () => api.get("/logs");

/** 통계 리셋 */
export const resetStats = () => api.post("/reset");

export default api;
