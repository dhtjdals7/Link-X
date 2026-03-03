import axios from 'axios';

const API_BASE = '/api/batch';

/**
 * 배치 테스트 실행
 * @param {Object} request - 배치 테스트 요청
 * @param {string} request.telegramId - 전문코드
 * @param {string} request.profileId - 접속 프로파일 ID
 * @param {string} request.executionMode - SEQUENTIAL | PARALLEL
 * @param {number} request.repeatCount - 반복 횟수
 * @param {number} request.delayMs - 건별 딜레이 (ms)
 * @param {number} request.parallelThreads - 병렬 스레드 수
 * @param {Object} request.baseFieldValues - 기본 필드값
 * @param {Array} request.itemOverrides - 건별 오버라이드 [{fieldName: value}, ...]
 */
export const executeBatch = async (request) => {
  const response = await axios.post(`${API_BASE}/execute`, request);
  return response.data;
};

/**
 * 배치 진행 상황 조회
 */
export const getBatchProgress = async (batchId) => {
  const response = await axios.get(`${API_BASE}/progress/${batchId}`);
  return response.data;
};

/**
 * 배치 중단
 */
export const cancelBatch = async (batchId) => {
  const response = await axios.post(`${API_BASE}/cancel/${batchId}`);
  return response.data;
};
