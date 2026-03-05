import React, { useState, useEffect, useRef, useCallback } from 'react';
import { executeBatch, cancelBatch } from '../api/batchApi';
import { getTelegramList, getLayout } from '../api/telegramApi';

/**
 * BatchTestTab - TelegramTester 페이지의 배치 모드 탭
 * 
 * 같은 전문을 N건 반복 송신하고 결과를 수집/표시
 * 순차 실행 / 병렬 실행 선택 가능
 */
const BatchTestTab = ({ profiles = [] }) => {
  // ── 전문 선택 ──
  const [telegramList, setTelegramList] = useState([]);
  const [selectedTelegramId, setSelectedTelegramId] = useState('');
  const [layoutFields, setLayoutFields] = useState([]);
  const [baseFieldValues, setBaseFieldValues] = useState({});

  // ── 배치 설정 ──
  const [executionMode, setExecutionMode] = useState('SEQUENTIAL');
  const [repeatCount, setRepeatCount] = useState(5);
  const [delayMs, setDelayMs] = useState(100);
  const [parallelThreads, setParallelThreads] = useState(4);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // ── 건별 오버라이드 ──
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [itemOverrides, setItemOverrides] = useState([]);
  const [overrideFieldName, setOverrideFieldName] = useState('');

  // ── 실행 상태 ──
  const [isRunning, setIsRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState('');

  // ── 결과 상세 ──
  const [selectedItemIdx, setSelectedItemIdx] = useState(null);
  const [resultView, setResultView] = useState('summary'); // summary | table | chart

  const runTimerRef = useRef(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // ── 전문 목록 로드 ──
  useEffect(() => {
    const loadTelegramList = async () => {
      try {
        const res = await getTelegramList();
        const list = res.data;
        setTelegramList(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('전문 목록 로드 실패', e);
      }
    };
    loadTelegramList();
  }, []);

  // ── 전문 선택 시 레이아웃 로드 ──
  useEffect(() => {
    if (!selectedTelegramId) {
      setLayoutFields([]);
      setBaseFieldValues({});
      return;
    }
    const loadLayout = async () => {
      try {
        const res = await getLayout(selectedTelegramId);
        const layout = Array.isArray(res.data) ? res.data : [];
        setLayoutFields(layout);
        // 기본값 초기화
        const defaults = {};
        layout.forEach(f => { defaults[f.fieldName] = f.defaultValue || ''; });
        setBaseFieldValues(defaults);
      } catch (e) {
        console.error('레이아웃 로드 실패', e);
      }
    };
    loadLayout();
  }, [selectedTelegramId]);

  // ── 기본 필드값 변경 ──
  const handleFieldChange = (fieldName, value) => {
    setBaseFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ── 건별 오버라이드 관리 ──
  const generateOverrides = () => {
    if (!overrideFieldName) return;
    const overrides = [];
    for (let i = 0; i < repeatCount; i++) {
      overrides.push({ [overrideFieldName]: `${baseFieldValues[overrideFieldName] || ''}${String(i + 1).padStart(4, '0')}` });
    }
    setItemOverrides(overrides);
  };

  const updateOverrideItem = (index, fieldName, value) => {
    setItemOverrides(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [fieldName]: value };
      return copy;
    });
  };

  // ── 배치 실행 ──
  const handleExecute = async () => {
    if (!selectedTelegramId) {
      setError('전문코드를 선택하세요.');
      return;
    }
    if (!selectedProfileId) {
      setError('접속 프로파일을 선택하세요.');
      return;
    }
    if (repeatCount <= 0 || repeatCount > 1000) {
      setError('반복 횟수는 1~1000 범위로 입력하세요.');
      return;
    }

    setError('');
    setIsRunning(true);
    setBatchResult(null);
    setSelectedItemIdx(null);
    setElapsedSec(0);

    // 실행 시간 타이머
    const startTime = Date.now();
    runTimerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const request = {
        telegramId: selectedTelegramId,
        profileId: selectedProfileId,
        executionMode,
        repeatCount,
        delayMs: executionMode === 'SEQUENTIAL' ? delayMs : 0,
        parallelThreads: executionMode === 'PARALLEL' ? parallelThreads : 1,
        baseFieldValues,
        itemOverrides: overrideEnabled ? itemOverrides : null,
      };

      const result = await executeBatch(request);
      setBatchResult(result);
      setResultView('summary');
    } catch (e) {
      setError(e.response?.data?.message || e.message || '배치 실행 실패');
    } finally {
      setIsRunning(false);
      clearInterval(runTimerRef.current);
    }
  };

  // ── 스타일 ──
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '24px',
      height: '100%',
      overflow: 'auto',
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
      color: '#e0e0e0',
    },
    section: {
      background: '#1e2130',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #2a2d42',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#8b8fa3',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    row: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '12px',
      flexWrap: 'wrap',
    },
    label: {
      fontSize: '13px',
      color: '#9ca0b8',
      minWidth: '100px',
    },
    input: {
      background: '#141625',
      border: '1px solid #2a2d42',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#e0e0e0',
      fontSize: '13px',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    select: {
      background: '#141625',
      border: '1px solid #2a2d42',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#e0e0e0',
      fontSize: '13px',
      outline: 'none',
      cursor: 'pointer',
    },
    modeToggle: {
      display: 'flex',
      gap: '4px',
      background: '#141625',
      borderRadius: '10px',
      padding: '4px',
    },
    modeBtn: (active) => ({
      padding: '8px 20px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: active ? '#3b82f6' : 'transparent',
      color: active ? '#fff' : '#8b8fa3',
    }),
    executeBtn: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 32px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
    },
    executeBtnDisabled: {
      background: '#2a2d42',
      color: '#555',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    // ── 결과 영역 ──
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '16px',
    },
    statCard: (color) => ({
      background: '#141625',
      borderRadius: '10px',
      padding: '16px',
      borderLeft: `4px solid ${color}`,
    }),
    statValue: {
      fontSize: '24px',
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
    },
    statLabel: {
      fontSize: '11px',
      color: '#8b8fa3',
      marginTop: '4px',
    },
    resultTable: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 2px',
      fontSize: '12px',
    },
    th: {
      padding: '10px 12px',
      textAlign: 'left',
      color: '#8b8fa3',
      fontWeight: 600,
      borderBottom: '1px solid #2a2d42',
      position: 'sticky',
      top: 0,
      background: '#1e2130',
    },
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid rgba(42,45,66,0.5)',
    },
    statusBadge: (status) => ({
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 700,
      background: status === 'SUCCESS' ? 'rgba(34,197,94,0.15)' : 
                  status === 'TIMEOUT' ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)',
      color: status === 'SUCCESS' ? '#22c55e' : 
             status === 'TIMEOUT' ? '#facc15' : '#ef4444',
    }),
    barContainer: {
      height: '20px',
      background: '#141625',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
    bar: (width, color) => ({
      height: '100%',
      width: `${width}%`,
      background: color,
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    }),
    fieldGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '8px',
    },
    fieldInput: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#141625',
      borderRadius: '8px',
      padding: '6px 10px',
      border: '1px solid #2a2d42',
    },
    runningOverlay: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '16px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #2a2d42',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    overrideTable: {
      maxHeight: '200px',
      overflowY: 'auto',
    },
    tabBar: {
      display: 'flex',
      gap: '4px',
      background: '#141625',
      borderRadius: '10px',
      padding: '4px',
      marginBottom: '16px',
    },
    tab: (active) => ({
      padding: '6px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      background: active ? '#2a2d42' : 'transparent',
      color: active ? '#e0e0e0' : '#8b8fa3',
      transition: 'all 0.2s',
    }),
    detailPanel: {
      background: '#141625',
      borderRadius: '10px',
      padding: '16px',
      marginTop: '12px',
      maxHeight: '300px',
      overflow: 'auto',
    },
    rawText: {
      fontFamily: "'JetBrains Mono', 'D2Coding', monospace",
      fontSize: '11px',
      color: '#a3a8c3',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      lineHeight: 1.6,
    },
    error: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px',
      padding: '10px 16px',
      color: '#ef4444',
      fontSize: '13px',
    },
    chartRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    },
    chartLabel: {
      fontSize: '11px',
      color: '#8b8fa3',
      minWidth: '30px',
      textAlign: 'right',
    },
  };

  // ── 응답시간 차트용 데이터 ──
  const getResponseTimeChartData = () => {
    if (!batchResult?.results) return [];
    const maxTime = batchResult.maxResponseTimeMs || 1;
    return batchResult.results.map((r, i) => ({
      seq: i + 1,
      time: r.responseTimeMs,
      percent: (r.responseTimeMs / maxTime) * 100,
      status: r.status,
    }));
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .batch-input:focus { border-color: #3b82f6 !important; }
        .batch-row:hover { background: rgba(59,130,246,0.05); }
        .batch-execute:hover:not(:disabled) { 
          transform: translateY(-1px); 
          box-shadow: 0 6px 20px rgba(59,130,246,0.4); 
        }
      `}</style>

      {/* ── 전문 선택 ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>📋</span> 전문 선택
        </div>
        <div style={styles.row}>
          <span style={styles.label}>전문코드</span>
          <select
            style={{ ...styles.select, flex: 1, maxWidth: '300px' }}
            value={selectedTelegramId}
            onChange={e => setSelectedTelegramId(e.target.value)}
          >
            <option value="">— 전문코드 선택 —</option>
            {telegramList.map(t => (
              <option key={t.telegramId} value={t.telegramId}>
                {t.telegramId} {t.telegramName ? `(${t.telegramName})` : ''}
              </option>
            ))}
          </select>

          <span style={styles.label}>접속 프로파일</span>
          <select
            style={{ ...styles.select, flex: 1, maxWidth: '300px' }}
            value={selectedProfileId}
            onChange={e => setSelectedProfileId(e.target.value)}
          >
            <option value="">— 프로파일 선택 —</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.profileName} ({p.host}:{p.port})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 기본 필드값 입력 ── */}
      {layoutFields.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>📝</span> 기본 필드값 (전체 건 공통)
          </div>
          <div style={styles.fieldGrid}>
            {layoutFields.filter(f => f.section === 'BODY').map(field => (
              <div key={field.fieldName} style={styles.fieldInput}>
                <span style={{ fontSize: '12px', color: '#8b8fa3', minWidth: '80px' }}>
                  {field.fieldName}
                </span>
                <input
                  className="batch-input"
                  style={{ ...styles.input, flex: 1, padding: '4px 8px' }}
                  value={baseFieldValues[field.fieldName] || ''}
                  onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                  placeholder={`${field.length}byte`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 배치 설정 ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>⚙️</span> 배치 설정
        </div>

        {/* 실행 모드 */}
        <div style={styles.row}>
          <span style={styles.label}>실행 모드</span>
          <div style={styles.modeToggle}>
            <button
              style={styles.modeBtn(executionMode === 'SEQUENTIAL')}
              onClick={() => setExecutionMode('SEQUENTIAL')}
            >
              🔄 순차 실행
            </button>
            <button
              style={styles.modeBtn(executionMode === 'PARALLEL')}
              onClick={() => setExecutionMode('PARALLEL')}
            >
              ⚡ 병렬 실행
            </button>
          </div>
        </div>

        {/* 반복 횟수 */}
        <div style={styles.row}>
          <span style={styles.label}>반복 횟수</span>
          <input
            className="batch-input"
            style={{ ...styles.input, width: '100px' }}
            type="number"
            min={1}
            max={1000}
            value={repeatCount}
            onChange={e => setRepeatCount(parseInt(e.target.value) || 1)}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>건 (최대 1,000)</span>
        </div>

        {/* 순차 모드: 딜레이 */}
        {executionMode === 'SEQUENTIAL' && (
          <div style={styles.row}>
            <span style={styles.label}>건별 딜레이</span>
            <input
              className="batch-input"
              style={{ ...styles.input, width: '100px' }}
              type="number"
              min={0}
              max={10000}
              value={delayMs}
              onChange={e => setDelayMs(parseInt(e.target.value) || 0)}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>ms</span>
          </div>
        )}

        {/* 병렬 모드: 스레드 수 */}
        {executionMode === 'PARALLEL' && (
          <div style={styles.row}>
            <span style={styles.label}>병렬 스레드</span>
            <input
              className="batch-input"
              style={{ ...styles.input, width: '100px' }}
              type="number"
              min={1}
              max={20}
              value={parallelThreads}
              onChange={e => setParallelThreads(parseInt(e.target.value) || 4)}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>개 (최대 20)</span>
          </div>
        )}

        {/* 건별 오버라이드 토글 */}
        <div style={styles.row}>
          <span style={styles.label}>건별 값 변경</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overrideEnabled}
              onChange={e => setOverrideEnabled(e.target.checked)}
            />
            <span style={{ fontSize: '13px', color: '#9ca0b8' }}>
              건별로 특정 필드값을 다르게 설정
            </span>
          </label>
        </div>

        {/* 오버라이드 설정 */}
        {overrideEnabled && layoutFields.length > 0 && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#141625', borderRadius: '8px' }}>
            <div style={styles.row}>
              <span style={styles.label}>변경할 필드</span>
              <select
                style={styles.select}
                value={overrideFieldName}
                onChange={e => setOverrideFieldName(e.target.value)}
              >
                <option value="">선택</option>
                {layoutFields.map(f => (
                  <option key={f.fieldName} value={f.fieldName}>{f.fieldName}</option>
                ))}
              </select>
              <button
                onClick={generateOverrides}
                style={{
                  ...styles.input,
                  cursor: 'pointer',
                  background: '#2a2d42',
                  border: '1px solid #3b82f6',
                  color: '#3b82f6',
                  fontSize: '12px',
                }}
              >
                자동 생성 (순번 접미사)
              </button>
            </div>

            {itemOverrides.length > 0 && (
              <div style={styles.overrideTable}>
                <table style={{ ...styles.resultTable, marginTop: '8px' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>필드명</th>
                      <th style={styles.th}>값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemOverrides.slice(0, 20).map((ov, idx) => (
                      <tr key={idx} className="batch-row">
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.td}>{Object.keys(ov)[0]}</td>
                        <td style={styles.td}>
                          <input
                            className="batch-input"
                            style={{ ...styles.input, width: '200px', padding: '2px 6px' }}
                            value={Object.values(ov)[0] || ''}
                            onChange={e => updateOverrideItem(idx, Object.keys(ov)[0], e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    {itemOverrides.length > 20 && (
                      <tr>
                        <td colSpan={3} style={{ ...styles.td, textAlign: 'center', color: '#666' }}>
                          ... 외 {itemOverrides.length - 20}건
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 실행 버튼 ── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className="batch-execute"
          style={{
            ...styles.executeBtn,
            ...(isRunning ? styles.executeBtnDisabled : {}),
          }}
          disabled={isRunning}
          onClick={handleExecute}
        >
          {isRunning ? `⏳ 실행 중... (${elapsedSec}s)` : `▶ 배치 실행 (${repeatCount}건)`}
        </button>
        {error && <div style={styles.error}>{error}</div>}
      </div>

      {/* ── 실행 중 ── */}
      {isRunning && (
        <div style={styles.section}>
          <div style={styles.runningOverlay}>
            <div style={styles.spinner} />
            <span style={{ fontSize: '14px', color: '#8b8fa3' }}>
              {executionMode === 'SEQUENTIAL' ? '순차' : '병렬'} 실행 중...
            </span>
            <span style={{ fontSize: '12px', color: '#666' }}>
              경과 시간: {elapsedSec}초
            </span>
          </div>
        </div>
      )}

      {/* ── 결과 영역 ── */}
      {batchResult && !isRunning && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>📊</span> 배치 결과
            <span style={{ 
              fontSize: '11px', color: '#666', fontWeight: 400, marginLeft: 'auto' 
            }}>
              Batch ID: {batchResult.batchId}
            </span>
          </div>

          {/* 결과 통계 카드 */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard('#3b82f6')}>
              <div style={{ ...styles.statValue, color: '#3b82f6' }}>{batchResult.totalCount}</div>
              <div style={styles.statLabel}>전체 건수</div>
            </div>
            <div style={styles.statCard('#22c55e')}>
              <div style={{ ...styles.statValue, color: '#22c55e' }}>{batchResult.successCount}</div>
              <div style={styles.statLabel}>성공</div>
            </div>
            <div style={styles.statCard('#ef4444')}>
              <div style={{ ...styles.statValue, color: '#ef4444' }}>{batchResult.failCount}</div>
              <div style={styles.statLabel}>실패</div>
            </div>
            <div style={styles.statCard('#a78bfa')}>
              <div style={{ ...styles.statValue, color: '#a78bfa' }}>
                {batchResult.totalElapsedMs}<span style={{ fontSize: '12px' }}>ms</span>
              </div>
              <div style={styles.statLabel}>총 소요시간</div>
            </div>
            <div style={styles.statCard('#f59e0b')}>
              <div style={{ ...styles.statValue, color: '#f59e0b' }}>
                {batchResult.avgResponseTimeMs?.toFixed(1)}<span style={{ fontSize: '12px' }}>ms</span>
              </div>
              <div style={styles.statLabel}>평균 응답시간</div>
            </div>
            <div style={styles.statCard('#6366f1')}>
              <div style={{ ...styles.statValue, color: '#6366f1' }}>
                {batchResult.minResponseTimeMs}~{batchResult.maxResponseTimeMs}
                <span style={{ fontSize: '12px' }}>ms</span>
              </div>
              <div style={styles.statLabel}>Min / Max</div>
            </div>
          </div>

          {/* 성공률 바 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#8b8fa3' }}>성공률</span>
              <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>
                {batchResult.totalCount > 0
                  ? ((batchResult.successCount / batchResult.totalCount) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div style={styles.barContainer}>
              <div style={styles.bar(
                batchResult.totalCount > 0
                  ? (batchResult.successCount / batchResult.totalCount) * 100 : 0,
                '#22c55e'
              )} />
            </div>
          </div>

          {/* 결과 뷰 탭 */}
          <div style={styles.tabBar}>
            <button style={styles.tab(resultView === 'summary')} onClick={() => setResultView('summary')}>
              건별 결과
            </button>
            <button style={styles.tab(resultView === 'chart')} onClick={() => setResultView('chart')}>
              응답시간 차트
            </button>
          </div>

          {/* 건별 결과 테이블 */}
          {resultView === 'summary' && (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <table style={styles.resultTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>상태</th>
                    <th style={styles.th}>응답시간</th>
                    <th style={styles.th}>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResult.results.map((item, idx) => (
                    <tr
                      key={idx}
                      className="batch-row"
                      style={{
                        cursor: 'pointer',
                        background: selectedItemIdx === idx ? 'rgba(59,130,246,0.1)' : 'transparent',
                      }}
                      onClick={() => setSelectedItemIdx(selectedItemIdx === idx ? null : idx)}
                    >
                      <td style={styles.td}>{item.sequence}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(item.status)}>{item.status}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.responseTimeMs}ms</span>
                      </td>
                      <td style={styles.td}>
                        {item.errorMessage && (
                          <span style={{ fontSize: '11px', color: '#ef4444' }}>{item.errorMessage}</span>
                        )}
                        {!item.errorMessage && item.status === 'SUCCESS' && (
                          <span style={{ fontSize: '11px', color: '#666' }}>클릭하여 상세 보기</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 응답시간 차트 (수평 바 차트) */}
          {resultView === 'chart' && (
            <div style={{ maxHeight: '400px', overflow: 'auto', padding: '8px 0' }}>
              {getResponseTimeChartData().map(d => (
                <div key={d.seq} style={styles.chartRow}>
                  <span style={styles.chartLabel}>#{d.seq}</span>
                  <div style={{ flex: 1, ...styles.barContainer, height: '16px' }}>
                    <div style={styles.bar(
                      d.percent,
                      d.status === 'SUCCESS' ? '#3b82f6' : '#ef4444'
                    )} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca0b8', minWidth: '60px', textAlign: 'right' }}>
                    {d.time}ms
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 선택한 건 상세 */}
          {selectedItemIdx !== null && batchResult.results[selectedItemIdx] && (
            <div style={styles.detailPanel}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#8b8fa3' }}>
                #{batchResult.results[selectedItemIdx].sequence} 상세 전문
              </div>

              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#3b82f6' }}>▸ 요청 원문</span>
                <div style={{ ...styles.rawText, marginTop: '4px', padding: '8px', background: '#0d0f1a', borderRadius: '6px' }}>
                  {batchResult.results[selectedItemIdx].requestRaw || '(없음)'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#22c55e' }}>▸ 응답 원문</span>
                <div style={{ ...styles.rawText, marginTop: '4px', padding: '8px', background: '#0d0f1a', borderRadius: '6px' }}>
                  {batchResult.results[selectedItemIdx].responseRaw || '(없음)'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchTestTab;
