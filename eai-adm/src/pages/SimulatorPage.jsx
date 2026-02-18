import { useState, useEffect, useCallback, useRef } from 'react';
import simulatorApi from '../api/simulatorApi';
import axios from 'axios';

/* ───────────────────────── 상수 ───────────────────────── */
const RULE_TYPES = [
  { value: 'FIXED', label: '고정값', desc: '지정한 값 그대로 응답' },
  { value: 'ECHO', label: '에코백', desc: '요청 필드값 그대로 리턴' },
  { value: 'ECHO_FROM', label: '다른 필드 복사', desc: '요청의 다른 필드값 복사' },
  { value: 'TIMESTAMP', label: '현재시각', desc: 'yyyyMMddHHmmss 등' },
  { value: 'SEQUENCE', label: '순번', desc: '자동 증가 순번' },
  { value: 'DEFAULT', label: '기본값', desc: '레이아웃 기본값 사용' },
];

const STATUS_COLORS = {
  SUCCESS: '#00bfa5',
  ERROR: '#ff5252',
  PARSE_ERROR: '#ff9800',
  NO_LAYOUT: '#ffc107',
  NO_RULE: '#78909c',
};

/* ───────────────────────── 메인 컴포넌트 ───────────────────────── */
export default function SimulatorPage() {
  // === State ===
  const [configs, setConfigs] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  // 응답 규칙 관련
  const [telegramIds, setTelegramIds] = useState([]);
  const [selectedTelegramId, setSelectedTelegramId] = useState('');
  const [rules, setRules] = useState([]);
  const [layoutFields, setLayoutFields] = useState([]);

  // 설정 편집 모달
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editConfig, setEditConfig] = useState(null);

  // 규칙 편집
  const [editingRule, setEditingRule] = useState(null);

  // 탭
  const [activeTab, setActiveTab] = useState('listeners'); // listeners | rules | logs

  // 폴링
  const pollingRef = useRef(null);
  const logPollingRef = useRef(null);

  /* ───────────────── 데이터 로드 ───────────────── */
  const loadStatuses = useCallback(async () => {
    try {
      const res = await simulatorApi.getListenerStatuses();
      setStatuses(res.data);
    } catch (e) {
      console.error('상태 조회 실패:', e);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await simulatorApi.getRecentLogs();
      setLogs(res.data);
    } catch (e) {
      console.error('로그 조회 실패:', e);
    }
  }, []);

  const loadTelegramIds = useCallback(async () => {
    try {
      // 전문코드 목록은 레이아웃에서 가져오기
      const res = await axios.get('/api/telegram/list');
      setTelegramIds(res.data || []);
    } catch (e) {
      console.error('전문코드 목록 조회 실패:', e);
    }
  }, []);

  const loadRules = useCallback(async (telegramId) => {
    if (!telegramId) return;
    try {
      const res = await simulatorApi.getRules(telegramId);
      setRules(res.data || []);
    } catch (e) {
      console.error('규칙 조회 실패:', e);
    }
  }, []);

  const loadLayoutFields = useCallback(async (telegramId) => {
    if (!telegramId) return;
    try {
      const res = await axios.get(`/api/telegram/layout/${telegramId}`);
      setLayoutFields(res.data || []);
    } catch (e) {
      console.error('레이아웃 조회 실패:', e);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
    loadLogs();
    loadTelegramIds();

    // 폴링 시작 (2초 간격)
    pollingRef.current = setInterval(loadStatuses, 2000);
    logPollingRef.current = setInterval(loadLogs, 3000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(logPollingRef.current);
    };
  }, [loadStatuses, loadLogs, loadTelegramIds]);

  useEffect(() => {
    if (selectedTelegramId) {
      loadRules(selectedTelegramId);
      loadLayoutFields(selectedTelegramId);
    }
  }, [selectedTelegramId, loadRules, loadLayoutFields]);

  /* ───────────────── 리스너 제어 ───────────────── */
  const handleStart = async (configId) => {
    try {
      await simulatorApi.startListener(configId);
      loadStatuses();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleStop = async (configId) => {
    try {
      await simulatorApi.stopListener(configId);
      loadStatuses();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleStopAll = async () => {
    try {
      await simulatorApi.stopAll();
      loadStatuses();
    } catch (e) {
      alert('전체 중지 실패');
    }
  };

  /* ───────────────── 설정 CRUD ───────────────── */
  const handleSaveConfig = async () => {
    try {
      if (editConfig.id) {
        await simulatorApi.updateConfig(editConfig.id, editConfig);
      } else {
        await simulatorApi.saveConfig(editConfig);
      }
      setShowConfigModal(false);
      setEditConfig(null);
      loadStatuses();
    } catch (e) {
      alert(e.response?.data?.message || '저장 실패');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await simulatorApi.deleteConfig(id);
      loadStatuses();
    } catch (e) {
      alert('삭제 실패');
    }
  };

  /* ───────────────── 응답 규칙 ───────────────── */
  const handleSaveRule = async (rule) => {
    try {
      await simulatorApi.saveRule(rule);
      loadRules(selectedTelegramId);
      setEditingRule(null);
    } catch (e) {
      alert('규칙 저장 실패');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await simulatorApi.deleteRule(ruleId);
      loadRules(selectedTelegramId);
    } catch (e) {
      alert('규칙 삭제 실패');
    }
  };

  const handleAutoGenRules = () => {
    // 레이아웃 필드를 기반으로 기본 규칙 자동 생성
    const newRules = layoutFields.map((field, idx) => ({
      telegramId: selectedTelegramId,
      fieldName: field.fieldName,
      ruleType: 'ECHO',
      sortOrder: idx + 1,
      active: true,
      description: `${field.fieldName} (${field.fieldLength}byte)`,
    }));
    setRules(newRules);
  };

  const handleBatchSaveRules = async () => {
    try {
      const rulesToSave = rules.map(r => ({
        ...r,
        telegramId: selectedTelegramId,
      }));
      await simulatorApi.saveRules(rulesToSave);
      loadRules(selectedTelegramId);
      alert('일괄 저장 완료');
    } catch (e) {
      alert('일괄 저장 실패');
    }
  };

  /* ───────────────── 렌더링 ───────────────── */
  const runningCount = statuses.filter(s => s.running).length;

  return (
    <div style={styles.container}>
      {/* ===== 헤더 ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleIcon}>⚡</div>
          <div>
            <h1 style={styles.title}>Simulator</h1>
            <p style={styles.subtitle}>TCP Mock Server — 전문 수신 · 파싱 · 자동 응답</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={{
            ...styles.statusBadge,
            background: runningCount > 0 ? 'rgba(0,191,165,0.15)' : 'rgba(120,144,156,0.15)',
            color: runningCount > 0 ? '#00bfa5' : '#78909c',
          }}>
            <span style={{
              ...styles.statusDot,
              background: runningCount > 0 ? '#00bfa5' : '#78909c',
            }} />
            {runningCount > 0 ? `${runningCount}개 리스너 실행 중` : '리스너 없음'}
          </div>
        </div>
      </div>

      {/* ===== 탭 ===== */}
      <div style={styles.tabBar}>
        {[
          { key: 'listeners', label: '리스너 제어', icon: '📡' },
          { key: 'rules', label: '응답 규칙', icon: '⚙️' },
          { key: 'logs', label: '수신/응답 로그', icon: '📋' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 탭 콘텐츠 ===== */}
      <div style={styles.content}>

        {/* ─── 리스너 제어 탭 ─── */}
        {activeTab === 'listeners' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>TCP 리스너 설정</h2>
              <div style={styles.sectionActions}>
                <button style={styles.btnDanger} onClick={handleStopAll}>전체 중지</button>
                <button style={styles.btnPrimary} onClick={() => {
                  setEditConfig({
                    name: '', port: 9090, encoding: 'EUC-KR',
                    lengthHeaderSize: 4, lengthIncludesHeader: false,
                    telegramIdOffset: 0, telegramIdLength: 4,
                    responseDelayMs: 0, active: true, description: '',
                  });
                  setShowConfigModal(true);
                }}>+ 리스너 추가</button>
              </div>
            </div>

            <div style={styles.cardGrid}>
              {statuses.map(s => (
                <div key={s.configId} style={{
                  ...styles.listenerCard,
                  borderLeftColor: s.running ? '#00bfa5' : '#455a64',
                }}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitle}>
                      <span style={{
                        ...styles.runDot,
                        background: s.running ? '#00bfa5' : '#455a64',
                        boxShadow: s.running ? '0 0 8px rgba(0,191,165,0.6)' : 'none',
                      }} />
                      {s.name}
                    </div>
                    <div style={styles.cardPort}>:{s.port}</div>
                  </div>

                  <div style={styles.cardMeta}>
                    <span>인코딩: {s.encoding}</span>
                    <span>헤더: {s.lengthHeaderSize}byte</span>
                    {s.responseDelayMs > 0 && <span>지연: {s.responseDelayMs}ms</span>}
                  </div>

                  {s.running && (
                    <div style={styles.cardStats}>
                      <div style={styles.statItem}>
                        <span style={styles.statValue}>{s.totalRequests || 0}</span>
                        <span style={styles.statLabel}>총 요청</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={{ ...styles.statValue, color: '#00bfa5' }}>{s.successCount || 0}</span>
                        <span style={styles.statLabel}>성공</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={{ ...styles.statValue, color: '#ff5252' }}>{s.errorCount || 0}</span>
                        <span style={styles.statLabel}>에러</span>
                      </div>
                    </div>
                  )}

                  <div style={styles.cardActions}>
                    {s.running ? (
                      <button style={styles.btnStop} onClick={() => handleStop(s.configId)}>■ 중지</button>
                    ) : (
                      <button style={styles.btnStart} onClick={() => handleStart(s.configId)}>▶ 시작</button>
                    )}
                    <button style={styles.btnGhost} onClick={() => {
                      setEditConfig(s);
                      setShowConfigModal(true);
                    }}>편집</button>
                    <button style={styles.btnGhost} onClick={() => handleDeleteConfig(s.configId)}>삭제</button>
                  </div>
                </div>
              ))}

              {statuses.length === 0 && (
                <div style={styles.emptyState}>
                  <p style={{ fontSize: 48, margin: '0 0 12px' }}>📡</p>
                  <p style={{ color: '#90a4ae', fontSize: 14 }}>등록된 리스너가 없습니다</p>
                  <p style={{ color: '#607d8b', fontSize: 13 }}>위의 "리스너 추가" 버튼으로 시작하세요</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 응답 규칙 탭 ─── */}
        {activeTab === 'rules' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>응답 규칙 설정</h2>
            </div>

            {/* 전문코드 선택 */}
            <div style={styles.ruleSelector}>
              <label style={styles.label}>전문코드 선택</label>
              <select
                style={styles.select}
                value={selectedTelegramId}
                onChange={(e) => setSelectedTelegramId(e.target.value)}
              >
                <option value="">-- 전문코드를 선택하세요 --</option>
                {telegramIds.map(id => (
                  <option key={id.telegramId || id} value={id.telegramId || id}>
                    {id.telegramId || id} {id.telegramName ? `— ${id.telegramName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedTelegramId && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button style={styles.btnSecondary} onClick={handleAutoGenRules}>
                    레이아웃에서 자동 생성
                  </button>
                  <button style={styles.btnPrimary} onClick={handleBatchSaveRules}>
                    일괄 저장
                  </button>
                  <button style={styles.btnGhost} onClick={() => {
                    setRules([...rules, {
                      telegramId: selectedTelegramId,
                      fieldName: '',
                      ruleType: 'FIXED',
                      fixedValue: '',
                      sortOrder: rules.length + 1,
                      active: true,
                    }]);
                  }}>
                    + 규칙 추가
                  </button>
                </div>

                {/* 규칙 테이블 */}
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>필드명</th>
                        <th style={styles.th}>규칙 타입</th>
                        <th style={styles.th}>설정값</th>
                        <th style={styles.th}>설명</th>
                        <th style={styles.th}>활성</th>
                        <th style={{ ...styles.th, width: 80 }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, idx) => (
                        <tr key={rule.id || idx} style={styles.tr}>
                          <td style={styles.td}>{idx + 1}</td>
                          <td style={styles.td}>
                            <select
                              style={styles.inlineSelect}
                              value={rule.fieldName}
                              onChange={(e) => {
                                const updated = [...rules];
                                updated[idx] = { ...rule, fieldName: e.target.value };
                                setRules(updated);
                              }}
                            >
                              <option value="">선택</option>
                              {layoutFields.map(f => (
                                <option key={f.fieldName} value={f.fieldName}>
                                  {f.fieldName} ({f.fieldLength}B)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={styles.td}>
                            <select
                              style={styles.inlineSelect}
                              value={rule.ruleType}
                              onChange={(e) => {
                                const updated = [...rules];
                                updated[idx] = { ...rule, ruleType: e.target.value };
                                setRules(updated);
                              }}
                            >
                              {RULE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={styles.td}>
                            {rule.ruleType === 'FIXED' && (
                              <input
                                style={styles.inlineInput}
                                placeholder="고정값 입력"
                                value={rule.fixedValue || ''}
                                onChange={(e) => {
                                  const updated = [...rules];
                                  updated[idx] = { ...rule, fixedValue: e.target.value };
                                  setRules(updated);
                                }}
                              />
                            )}
                            {rule.ruleType === 'ECHO_FROM' && (
                              <select
                                style={styles.inlineSelect}
                                value={rule.sourceField || ''}
                                onChange={(e) => {
                                  const updated = [...rules];
                                  updated[idx] = { ...rule, sourceField: e.target.value };
                                  setRules(updated);
                                }}
                              >
                                <option value="">소스 필드 선택</option>
                                {layoutFields.map(f => (
                                  <option key={f.fieldName} value={f.fieldName}>{f.fieldName}</option>
                                ))}
                              </select>
                            )}
                            {rule.ruleType === 'TIMESTAMP' && (
                              <input
                                style={styles.inlineInput}
                                placeholder="yyyyMMddHHmmss"
                                value={rule.timeFormat || ''}
                                onChange={(e) => {
                                  const updated = [...rules];
                                  updated[idx] = { ...rule, timeFormat: e.target.value };
                                  setRules(updated);
                                }}
                              />
                            )}
                            {rule.ruleType === 'SEQUENCE' && (
                              <input
                                style={styles.inlineInput}
                                placeholder="접두사"
                                value={rule.seqPrefix || ''}
                                onChange={(e) => {
                                  const updated = [...rules];
                                  updated[idx] = { ...rule, seqPrefix: e.target.value };
                                  setRules(updated);
                                }}
                              />
                            )}
                            {(rule.ruleType === 'ECHO' || rule.ruleType === 'DEFAULT') && (
                              <span style={{ color: '#607d8b', fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <input
                              style={styles.inlineInput}
                              placeholder="메모"
                              value={rule.description || ''}
                              onChange={(e) => {
                                const updated = [...rules];
                                updated[idx] = { ...rule, description: e.target.value };
                                setRules(updated);
                              }}
                            />
                          </td>
                          <td style={styles.td}>
                            <input
                              type="checkbox"
                              checked={rule.active !== false}
                              onChange={(e) => {
                                const updated = [...rules];
                                updated[idx] = { ...rule, active: e.target.checked };
                                setRules(updated);
                              }}
                            />
                          </td>
                          <td style={styles.td}>
                            <button
                              style={styles.btnIcon}
                              onClick={() => {
                                if (rule.id) handleDeleteRule(rule.id);
                                else {
                                  const updated = rules.filter((_, i) => i !== idx);
                                  setRules(updated);
                                }
                              }}
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {rules.length === 0 && (
                    <div style={{ ...styles.emptyState, padding: '32px 0' }}>
                      <p style={{ color: '#90a4ae', fontSize: 13 }}>
                        등록된 응답 규칙이 없습니다. "레이아웃에서 자동 생성" 또는 "규칙 추가"를 눌러주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 수신/응답 로그 탭 ─── */}
        {activeTab === 'logs' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>수신/응답 로그</h2>
              <button style={styles.btnGhost} onClick={loadLogs}>새로고침</button>
            </div>

            <div style={styles.logContainer}>
              {/* 로그 목록 */}
              <div style={styles.logList}>
                {logs.map(log => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      ...styles.logItem,
                      borderLeftColor: STATUS_COLORS[log.status] || '#455a64',
                      background: selectedLog?.id === log.id
                        ? 'rgba(0,191,165,0.08)' : 'transparent',
                    }}
                  >
                    <div style={styles.logItemHeader}>
                      <span style={{
                        ...styles.logStatus,
                        color: STATUS_COLORS[log.status] || '#455a64',
                      }}>
                        {log.status}
                      </span>
                      <span style={styles.logTime}>
                        {log.receivedAt ? new Date(log.receivedAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div style={styles.logItemBody}>
                      <span style={styles.logTelegramId}>[{log.telegramId || '?'}]</span>
                      <span style={styles.logClient}>{log.clientIp}:{log.clientPort}</span>
                      <span style={styles.logProcessTime}>{log.processTimeMs}ms</span>
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div style={{ ...styles.emptyState, padding: '48px 0' }}>
                    <p style={{ fontSize: 36, margin: '0 0 8px' }}>📋</p>
                    <p style={{ color: '#607d8b', fontSize: 13 }}>수신 로그가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 로그 상세 */}
              <div style={styles.logDetail}>
                {selectedLog ? (
                  <div>
                    <div style={styles.detailHeader}>
                      <span style={{
                        ...styles.logStatus,
                        color: STATUS_COLORS[selectedLog.status] || '#455a64',
                        fontSize: 14,
                      }}>
                        {selectedLog.status}
                      </span>
                      <span style={{ color: '#90a4ae', fontSize: 13 }}>
                        전문코드: {selectedLog.telegramId} &nbsp;|&nbsp;
                        {selectedLog.processTimeMs}ms &nbsp;|&nbsp;
                        {selectedLog.clientIp}:{selectedLog.clientPort}
                      </span>
                    </div>

                    {selectedLog.errorMessage && (
                      <div style={styles.errorBox}>
                        {selectedLog.errorMessage}
                      </div>
                    )}

                    <div style={styles.rawSection}>
                      <h4 style={styles.rawTitle}>▼ 수신 전문 (Request)</h4>
                      <pre style={styles.rawPre}>{selectedLog.requestRaw || '(없음)'}</pre>
                    </div>

                    <div style={styles.rawSection}>
                      <h4 style={styles.rawTitle}>▼ 응답 전문 (Response)</h4>
                      <pre style={styles.rawPre}>{selectedLog.responseRaw || '(없음)'}</pre>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.emptyState, padding: '64px 0' }}>
                    <p style={{ color: '#607d8b', fontSize: 13 }}>좌측 로그를 선택하면 상세 내역이 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 설정 모달 ===== */}
      {showConfigModal && editConfig && (
        <div style={styles.modalOverlay} onClick={() => setShowConfigModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editConfig.id ? '리스너 수정' : '리스너 추가'}
            </h3>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>리스너 이름</label>
                <input style={styles.formInput} value={editConfig.name || ''}
                  placeholder="예: 계정계 시뮬레이터"
                  onChange={e => setEditConfig({ ...editConfig, name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>포트</label>
                <input style={styles.formInput} type="number" value={editConfig.port || 9090}
                  onChange={e => setEditConfig({ ...editConfig, port: parseInt(e.target.value) })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>인코딩</label>
                <select style={styles.formSelect} value={editConfig.encoding || 'EUC-KR'}
                  onChange={e => setEditConfig({ ...editConfig, encoding: e.target.value })}>
                  <option value="EUC-KR">EUC-KR</option>
                  <option value="UTF-8">UTF-8</option>
                  <option value="MS949">MS949</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>길이 헤더 크기</label>
                <select style={styles.formSelect} value={editConfig.lengthHeaderSize}
                  onChange={e => setEditConfig({ ...editConfig, lengthHeaderSize: parseInt(e.target.value) })}>
                  <option value={0}>없음</option>
                  <option value={4}>4 byte</option>
                  <option value={8}>8 byte</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>전문코드 오프셋</label>
                <input style={styles.formInput} type="number" value={editConfig.telegramIdOffset || 0}
                  onChange={e => setEditConfig({ ...editConfig, telegramIdOffset: parseInt(e.target.value) })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>전문코드 길이</label>
                <input style={styles.formInput} type="number" value={editConfig.telegramIdLength || 4}
                  onChange={e => setEditConfig({ ...editConfig, telegramIdLength: parseInt(e.target.value) })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>응답 지연 (ms)</label>
                <input style={styles.formInput} type="number" value={editConfig.responseDelayMs || 0}
                  onChange={e => setEditConfig({ ...editConfig, responseDelayMs: parseInt(e.target.value) })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>&nbsp;</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b0bec5', fontSize: 13 }}>
                  <input type="checkbox" checked={editConfig.lengthIncludesHeader || false}
                    onChange={e => setEditConfig({ ...editConfig, lengthIncludesHeader: e.target.checked })} />
                  길이 헤더에 자기 자신 포함
                </label>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>설명</label>
              <input style={styles.formInput} value={editConfig.description || ''}
                placeholder="시뮬레이터 설명 (선택)"
                onChange={e => setEditConfig({ ...editConfig, description: e.target.value })} />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnGhost} onClick={() => setShowConfigModal(false)}>취소</button>
              <button style={styles.btnPrimary} onClick={handleSaveConfig}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 스타일 ───────────────────────── */
const styles = {
  container: {
    fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
    color: '#e0e0e0',
    minHeight: '100vh',
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 0', borderBottom: '1px solid #263238', marginBottom: 20,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerRight: {},
  titleIcon: { fontSize: 32 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#eceff1', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0', fontSize: 13, color: '#78909c' },
  statusBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },

  // Tabs
  tabBar: {
    display: 'flex', gap: 2, marginBottom: 20,
    borderBottom: '1px solid #263238', paddingBottom: 0,
  },
  tab: {
    padding: '10px 20px', background: 'transparent', border: 'none',
    color: '#78909c', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    borderBottom: '2px solid transparent', transition: 'all 0.2s',
  },
  tabActive: {
    color: '#00bfa5', borderBottomColor: '#00bfa5',
  },

  content: { },

  // Section
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#cfd8dc' },
  sectionActions: { display: 'flex', gap: 8 },

  // Listener Cards
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  listenerCard: {
    background: '#1a2332', borderRadius: 8,
    border: '1px solid #263238', borderLeft: '3px solid #455a64',
    padding: 20,
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 15, fontWeight: 600, color: '#eceff1',
  },
  cardPort: {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700,
    color: '#00bfa5',
  },
  runDot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
  },
  cardMeta: {
    display: 'flex', gap: 16, marginBottom: 14,
    fontSize: 12, color: '#78909c',
  },
  cardStats: {
    display: 'flex', gap: 24, padding: '12px 0',
    borderTop: '1px solid #263238', marginBottom: 12,
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 700, color: '#eceff1', fontFamily: "'IBM Plex Mono', monospace" },
  statLabel: { fontSize: 11, color: '#607d8b', marginTop: 2 },
  cardActions: { display: 'flex', gap: 8 },

  // Buttons
  btnPrimary: {
    padding: '8px 16px', background: '#00bfa5', color: '#0d1117',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '8px 16px', background: '#263238', color: '#b0bec5',
    border: '1px solid #37474f', borderRadius: 6, fontSize: 13,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '8px 16px', background: 'rgba(255,82,82,0.15)', color: '#ff5252',
    border: '1px solid rgba(255,82,82,0.3)', borderRadius: 6, fontSize: 13,
    cursor: 'pointer',
  },
  btnStart: {
    padding: '8px 16px', background: 'rgba(0,191,165,0.15)', color: '#00bfa5',
    border: '1px solid rgba(0,191,165,0.3)', borderRadius: 6, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  btnStop: {
    padding: '8px 16px', background: 'rgba(255,82,82,0.15)', color: '#ff5252',
    border: '1px solid rgba(255,82,82,0.3)', borderRadius: 6, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  btnGhost: {
    padding: '8px 14px', background: 'transparent', color: '#78909c',
    border: '1px solid #37474f', borderRadius: 6, fontSize: 13,
    cursor: 'pointer',
  },
  btnIcon: {
    width: 28, height: 28, background: 'transparent', border: 'none',
    color: '#ff5252', fontSize: 16, cursor: 'pointer', borderRadius: 4,
  },

  // Rules
  ruleSelector: { marginBottom: 20 },
  label: { display: 'block', fontSize: 12, color: '#78909c', marginBottom: 6 },
  select: {
    width: '100%', maxWidth: 400, padding: '10px 12px', background: '#1a2332',
    color: '#eceff1', border: '1px solid #37474f', borderRadius: 6, fontSize: 13,
  },

  // Table
  tableWrap: {
    overflowX: 'auto', background: '#1a2332',
    border: '1px solid #263238', borderRadius: 8,
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left', padding: '10px 12px',
    background: '#0f1923', color: '#78909c', fontWeight: 600,
    borderBottom: '1px solid #263238', fontSize: 12,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #1e2d3d' },
  td: { padding: '8px 12px', verticalAlign: 'middle' },
  inlineSelect: {
    padding: '5px 8px', background: '#0f1923', color: '#eceff1',
    border: '1px solid #37474f', borderRadius: 4, fontSize: 12,
    minWidth: 100,
  },
  inlineInput: {
    padding: '5px 8px', background: '#0f1923', color: '#eceff1',
    border: '1px solid #37474f', borderRadius: 4, fontSize: 12,
    width: '100%',
  },

  // Log
  logContainer: {
    display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0,
    background: '#1a2332', border: '1px solid #263238', borderRadius: 8,
    overflow: 'hidden', minHeight: 500,
  },
  logList: {
    borderRight: '1px solid #263238', overflowY: 'auto', maxHeight: 600,
  },
  logItem: {
    padding: '12px 16px', borderBottom: '1px solid #1e2d3d',
    borderLeft: '3px solid transparent', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  logItemHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  logStatus: { fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" },
  logTime: { fontSize: 11, color: '#607d8b' },
  logItemBody: {
    display: 'flex', gap: 12, fontSize: 12, color: '#90a4ae',
  },
  logTelegramId: {
    fontFamily: "'IBM Plex Mono', monospace", color: '#00bfa5', fontWeight: 600,
  },
  logClient: { },
  logProcessTime: { color: '#ffc107' },
  logDetail: { padding: 20 },
  detailHeader: {
    display: 'flex', gap: 16, alignItems: 'center',
    marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #263238',
  },
  errorBox: {
    padding: '10px 14px', background: 'rgba(255,82,82,0.1)',
    border: '1px solid rgba(255,82,82,0.3)', borderRadius: 6,
    color: '#ff8a80', fontSize: 13, marginBottom: 16,
  },
  rawSection: { marginBottom: 16 },
  rawTitle: { margin: '0 0 8px', fontSize: 13, color: '#78909c', fontWeight: 600 },
  rawPre: {
    margin: 0, padding: 14, background: '#0f1923', borderRadius: 6,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
    color: '#b0bec5', overflowX: 'auto', whiteSpace: 'pre-wrap',
    wordBreak: 'break-all', border: '1px solid #1e2d3d',
    maxHeight: 200,
  },

  // Empty
  emptyState: { textAlign: 'center', padding: '48px 20px' },

  // Modal
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#1a2332', borderRadius: 12, padding: 28,
    width: '100%', maxWidth: 560, border: '1px solid #37474f',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: 18, color: '#eceff1', fontWeight: 600 },
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16,
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formLabel: { fontSize: 12, color: '#78909c', fontWeight: 500 },
  formInput: {
    padding: '9px 12px', background: '#0f1923', color: '#eceff1',
    border: '1px solid #37474f', borderRadius: 6, fontSize: 13,
  },
  formSelect: {
    padding: '9px 12px', background: '#0f1923', color: '#eceff1',
    border: '1px solid #37474f', borderRadius: 6, fontSize: 13,
  },
  modalActions: {
    display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24,
  },
};
