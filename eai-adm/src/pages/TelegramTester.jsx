import { useState, useEffect, useCallback } from "react";
import BatchTestTab from "../components/BatchTestTab";

const API_BASE = "/api/telegram";

// ── 색상 테마 ──
const theme = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceHover: "#1a2332",
  border: "#1e293b",
  borderFocus: "#3b82f6",
  accent: "#3b82f6",
  accentGlow: "rgba(59,130,246,0.15)",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  text: "#e2e8f0",
  textDim: "#64748b",
  textMuted: "#475569",
  headerBg: "#0f172a",
};

const PROTOCOLS = {
  TCP: { label: "TCP/IP Socket", icon: "⚡", color: "#3b82f6" },
  HTTP: { label: "HTTP/REST", icon: "🌐", color: "#10b981" },
  MQ: { label: "IBM MQ", icon: "📨", color: "#f59e0b" },
};

export default function TelegramTester() {
  // ── 모드 전환: 단건 / 배치 ──
  const [testMode, setTestMode] = useState("single");

  const [telegrams, setTelegrams] = useState([]);
  const [selectedTelegram, setSelectedTelegram] = useState("");
  const [layouts, setLayouts] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [protocol, setProtocol] = useState("TCP");
  const [charset, setCharset] = useState("EUC-KR");
  const [connConfig, setConnConfig] = useState({
    host: "127.0.0.1", port: 9090, url: "", timeoutMs: 30000,
    includeLengthHeader: true, lengthHeaderSize: 4, httpMethod: "POST",
    contentType: "application/octet-stream", queueManager: "",
    requestQueue: "", responseQueue: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("fields");
  const [resultTab, setResultTab] = useState("parsed");
  const [history, setHistory] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/list`)
      .then((r) => { if (!r.ok) throw new Error('서버 에러'); return r.json(); })
      .then((data) => { setTelegrams(Array.isArray(data) ? data : []); })
      .catch(() => {
        setTelegrams([
          { telegramId: "SAMPLE001", telegramName: "샘플 거래전문" },
          { telegramId: "SAMPLE002", telegramName: "계좌조회 전문" },
        ]);
      });
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => { if (!r.ok) throw new Error('서버 에러'); return r.json(); })
      .then((data) => { setProfiles(Array.isArray(data) ? data : []); })
      .catch(() => {
        setProfiles([
          { id: "1", profileName: "로컬 Simulator", host: "127.0.0.1", port: 9090, protocol: "TCP" },
          { id: "2", profileName: "개발서버", host: "192.168.1.100", port: 9090, protocol: "TCP" },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!selectedTelegram) return;
    fetch(`${API_BASE}/layout/${selectedTelegram}`)
      .then((r) => r.json())
      .then((data) => {
        setLayouts(data);
        const defaults = {};
        data.forEach((f) => { defaults[f.fieldName] = f.defaultValue || ""; });
        setFieldValues(defaults);
      })
      .catch(() => {
        const demo = getDemoLayout();
        setLayouts(demo);
        const defaults = {};
        demo.forEach((f) => (defaults[f.fieldName] = f.defaultValue || ""));
        setFieldValues(defaults);
      });
  }, [selectedTelegram]);

  const handleFieldChange = useCallback((fieldName, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/preview`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: selectedTelegram, fieldValues, charset }),
      });
      const data = await res.json();
      setResult(data); setResultTab("raw");
    } catch (e) { setResult(buildPreviewLocal()); }
    setLoading(false);
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: selectedTelegram, fieldValues, charset, protocol, ...connConfig }),
      });
      const data = await res.json();
      setResult(data); setResultTab("parsed");
    } catch (e) { setResult({ success: false, error: e.message }); }
    setLoading(false);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test-connection`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol, host: connConfig.host, port: connConfig.port, url: connConfig.url }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { setResult({ connected: false, error: e.message }); }
    setLoading(false);
  };

  const buildPreviewLocal = () => {
    let raw = "";
    layouts.forEach((f) => {
      let val = fieldValues[f.fieldName] || f.defaultValue || "";
      if (f.dataType === "NUMBER" && f.align === "RIGHT") { val = val.padStart(f.fieldLength, "0"); }
      else { val = val.padEnd(f.fieldLength, " "); }
      raw += val.substring(0, f.fieldLength);
    });
    const totalLen = layouts.reduce((s, f) => s + f.fieldLength, 0);
    return { success: true, rawText: raw, totalLength: totalLen, fieldCount: layouts.length, local: true };
  };

  const totalLength = layouts.reduce((s, f) => s + f.fieldLength, 0);

  return (
    <div style={styles.container}>
      {/* ── 헤더 ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>Link-X</span>
            <span style={styles.logoBadge}>TELEGRAM</span>
          </div>
          {/* ── 단건/배치 모드 전환 ── */}
          <div style={styles.modeToggle}>
            <button onClick={() => setTestMode("single")}
              style={{ ...styles.modeBtn, ...(testMode === "single" ? styles.modeBtnActive : {}) }}>
              <span style={{ fontSize: 14 }}>📡</span> 단건 테스트
            </button>
            <button onClick={() => setTestMode("batch")}
              style={{ ...styles.modeBtn, ...(testMode === "batch" ? styles.modeBtnActive : {}) }}>
              <span style={{ fontSize: 14 }}>🔄</span> 배치 테스트
            </button>
          </div>
        </div>
        <div style={styles.headerRight}>
          {testMode === "single" && (
            <>
              <div style={styles.charsetSelect}>
                <label style={styles.miniLabel}>Charset</label>
                <select value={charset} onChange={(e) => setCharset(e.target.value)} style={styles.selectSmall}>
                  <option>EUC-KR</option><option>UTF-8</option><option>MS949</option>
                </select>
              </div>
              <div style={styles.totalLength}>
                전문길이 <strong style={{ color: theme.accent }}>{totalLength}</strong> bytes
              </div>
            </>
          )}
          {testMode === "batch" && (
            <div style={styles.totalLength}>
              <span style={{ color: theme.warning, fontWeight: 700 }}>BATCH MODE</span>
            </div>
          )}
        </div>
      </header>

      {/* ── 배치 모드 ── */}
      {testMode === "batch" && (
        <div style={{ height: "calc(100vh - 52px)", overflow: "auto" }}>
          <BatchTestTab profiles={profiles} />
        </div>
      )}

      {/* ── 단건 모드 (기존 UI) ── */}
      {testMode === "single" && (
        <div style={styles.main}>
          <div style={styles.leftPanel}>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📋 전문 선택</div>
              <select value={selectedTelegram} onChange={(e) => setSelectedTelegram(e.target.value)} style={styles.select}>
                <option value="">-- 전문 선택 --</option>
                {Array.isArray(telegrams) && telegrams.map((t) => (
                  <option key={t.telegramId} value={t.telegramId}>[{t.telegramId}] {t.telegramName}</option>
                ))}
              </select>
            </div>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>🔌 프로토콜</div>
              <div style={styles.protocolGrid}>
                {Object.entries(PROTOCOLS).map(([key, p]) => (
                  <button key={key} onClick={() => setProtocol(key)}
                    style={{ ...styles.protocolBtn, ...(protocol === key ? styles.protocolBtnActive : {}), borderColor: protocol === key ? p.color : theme.border }}>
                    <span style={styles.protocolIcon}>{p.icon}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>🖥️ 접속 정보</div>
              <ConnectionForm protocol={protocol} config={connConfig} onChange={setConnConfig} />
            </div>
            <div style={styles.actionBar}>
              <button onClick={handleTestConnection} style={styles.btnSecondary} disabled={loading}>🔗 연결 테스트</button>
              <button onClick={handlePreview} style={styles.btnOutline} disabled={loading || !selectedTelegram}>👁️ 미리보기</button>
              <button onClick={handleSend} style={styles.btnPrimary} disabled={loading || !selectedTelegram}>
                {loading ? "⏳ 전송중..." : "🚀 전문 전송"}
              </button>
            </div>
          </div>
          <div style={styles.rightPanel}>
            <div style={styles.tabs}>
              {[
                { key: "fields", label: "📝 필드 편집", count: layouts.length },
                { key: "raw", label: "📄 Raw 전문" },
                { key: "history", label: "📜 이력" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}>
                  {tab.label}
                  {tab.count && <span style={styles.badge}>{tab.count}</span>}
                </button>
              ))}
            </div>
            {activeTab === "fields" && <FieldEditor layouts={layouts} fieldValues={fieldValues} onChange={handleFieldChange} />}
            {activeTab === "raw" && <RawViewer result={result} layouts={layouts} fieldValues={fieldValues} />}
            {activeTab === "history" && <HistoryViewer history={history} />}
            {result && <ResultPanel result={result} resultTab={resultTab} setResultTab={setResultTab} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionForm({ protocol, config, onChange }) {
  const update = (key, value) => onChange({ ...config, [key]: value });
  return (
    <div style={styles.connForm}>
      {(protocol === "TCP" || protocol === "HTTP") && (
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>Host</label><input style={styles.input} value={config.host} onChange={(e) => update("host", e.target.value)} placeholder="127.0.0.1" /></div>
          <div style={styles.formGroupSmall}><label style={styles.label}>Port</label><input style={styles.input} type="number" value={config.port} onChange={(e) => update("port", parseInt(e.target.value) || 0)} /></div>
          <div style={styles.formGroupSmall}><label style={styles.label}>Timeout(ms)</label><input style={styles.input} type="number" value={config.timeoutMs} onChange={(e) => update("timeoutMs", parseInt(e.target.value) || 30000)} /></div>
        </div>
      )}
      {protocol === "TCP" && (
        <div style={styles.formRow}>
          <div style={styles.checkboxGroup}><label style={styles.checkLabel}><input type="checkbox" checked={config.includeLengthHeader} onChange={(e) => update("includeLengthHeader", e.target.checked)} /><span style={{ marginLeft: 6 }}>길이 헤더 포함</span></label></div>
          {config.includeLengthHeader && (<div style={styles.formGroupSmall}><label style={styles.label}>헤더 크기</label><select style={styles.selectSmall} value={config.lengthHeaderSize} onChange={(e) => update("lengthHeaderSize", parseInt(e.target.value))}><option value={4}>4 bytes</option><option value={8}>8 bytes</option></select></div>)}
        </div>
      )}
      {protocol === "HTTP" && (
        <div style={styles.formRow}>
          <div style={styles.formGroup}><label style={styles.label}>URL</label><input style={styles.input} value={config.url} onChange={(e) => update("url", e.target.value)} placeholder="http://localhost:8080/api/send" /></div>
          <div style={styles.formGroupSmall}><label style={styles.label}>Method</label><select style={styles.selectSmall} value={config.httpMethod} onChange={(e) => update("httpMethod", e.target.value)}><option>POST</option><option>PUT</option></select></div>
        </div>
      )}
      {protocol === "MQ" && (
        <>
          <div style={styles.formRow}><div style={styles.formGroup}><label style={styles.label}>Queue Manager</label><input style={styles.input} value={config.queueManager} onChange={(e) => update("queueManager", e.target.value)} placeholder="QM_DEV" /></div></div>
          <div style={styles.formRow}><div style={styles.formGroup}><label style={styles.label}>Request Queue</label><input style={styles.input} value={config.requestQueue} onChange={(e) => update("requestQueue", e.target.value)} placeholder="DEV.QUEUE.REQ" /></div><div style={styles.formGroup}><label style={styles.label}>Response Queue</label><input style={styles.input} value={config.responseQueue} onChange={(e) => update("responseQueue", e.target.value)} placeholder="DEV.QUEUE.RES" /></div></div>
        </>
      )}
    </div>
  );
}

function FieldEditor({ layouts, fieldValues, onChange }) {
  const headerFields = layouts.filter((f) => f.section === "HEADER");
  const bodyFields = layouts.filter((f) => f.section === "BODY");
  const renderFieldGroup = (fields, title) => (
    <div style={styles.fieldGroup}>
      <div style={styles.fieldGroupTitle}>{title}</div>
      <div style={styles.fieldTable}>
        <div style={styles.fieldTableHeader}>
          <span style={{ flex: "0 0 40px" }}>#</span>
          <span style={{ flex: "0 0 130px" }}>필드명</span>
          <span style={{ flex: "0 0 130px" }}>한글명</span>
          <span style={{ flex: "0 0 50px" }}>길이</span>
          <span style={{ flex: "0 0 60px" }}>타입</span>
          <span style={{ flex: 1 }}>값</span>
        </div>
        {fields.map((f, idx) => {
          const byteLen = (fieldValues[f.fieldName] || "").length;
          const overLength = byteLen > f.fieldLength;
          return (
            <div key={f.fieldName} style={styles.fieldRow}>
              <span style={{ ...styles.fieldCell, flex: "0 0 40px", color: theme.textMuted }}>{f.fieldSeq || idx + 1}</span>
              <span style={{ ...styles.fieldCell, flex: "0 0 130px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{f.fieldName}</span>
              <span style={{ ...styles.fieldCell, flex: "0 0 130px" }}>{f.fieldNameKr}{f.required && <span style={{ color: theme.error, marginLeft: 2 }}>*</span>}</span>
              <span style={{ ...styles.fieldCell, flex: "0 0 50px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{f.fieldLength}</span>
              <span style={{ ...styles.fieldCell, flex: "0 0 60px", fontSize: 11, color: f.dataType === "NUMBER" ? "#60a5fa" : f.dataType === "FILLER" ? theme.textMuted : theme.text }}>{f.dataType}</span>
              <div style={{ flex: 1, position: "relative" }}>
                <input style={{ ...styles.fieldInput, borderColor: overLength ? theme.error : "transparent", background: overLength ? "rgba(239,68,68,0.1)" : theme.bg }}
                  value={fieldValues[f.fieldName] || ""} onChange={(e) => onChange(f.fieldName, e.target.value)} placeholder={f.defaultValue || ""} disabled={f.dataType === "FILLER"} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  if (!layouts.length) { return (<div style={styles.emptyState}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><div>전문을 선택해주세요</div></div>); }
  return (
    <div style={styles.fieldEditor}>
      {headerFields.length > 0 && renderFieldGroup(headerFields, "📌 공통 헤더")}
      {bodyFields.length > 0 && renderFieldGroup(bodyFields, "📦 개별부")}
      {headerFields.length === 0 && bodyFields.length === 0 && renderFieldGroup(layouts, "📋 전문 필드")}
    </div>
  );
}

function RawViewer({ result, layouts, fieldValues }) {
  let rawText = "";
  if (result?.rawText) { rawText = result.rawText; }
  else { layouts.forEach((f) => { let val = fieldValues[f.fieldName] || f.defaultValue || ""; if (f.dataType === "NUMBER") { val = val.padStart(f.fieldLength, "0"); } else { val = val.padEnd(f.fieldLength, " "); } rawText += val.substring(0, f.fieldLength); }); }
  const colorizedSegments = [];
  const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1"];
  let offset = 0;
  layouts.forEach((f, i) => { colorizedSegments.push({ text: rawText.substring(offset, offset + f.fieldLength), color: colors[i % colors.length], field: f }); offset += f.fieldLength; });
  return (
    <div style={styles.rawViewer}>
      <div style={styles.rawHeader}><span>Raw 전문 ({rawText.length} bytes)</span></div>
      <div style={styles.rawContent}>
        {colorizedSegments.map((seg, i) => (
          <span key={i} title={`${seg.field.fieldNameKr} (${seg.field.fieldName}) [${seg.field.fieldLength}B]`}
            style={{ backgroundColor: `${seg.color}22`, borderBottom: `2px solid ${seg.color}`, padding: "2px 0", cursor: "help", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 0.5 }}>
            {seg.text}
          </span>
        ))}
      </div>
      {result?.rawHex && (<div style={styles.hexDump}><div style={styles.rawHeader}>Hex Dump</div><pre style={styles.hexContent}>{result.rawHex}</pre></div>)}
    </div>
  );
}

function ResultPanel({ result, resultTab, setResultTab }) {
  const isSuccess = result?.success || result?.connected;
  return (
    <div style={{ ...styles.resultPanel, borderTopColor: isSuccess ? theme.success : result?.error ? theme.error : theme.border }}>
      <div style={styles.resultHeader}>
        <div style={styles.resultTabs}>
          {["parsed","raw","json"].map((tab) => (
            <button key={tab} onClick={() => setResultTab(tab)} style={{ ...styles.resultTab, ...(resultTab === tab ? styles.resultTabActive : {}) }}>
              {tab === "parsed" ? "파싱 결과" : tab === "raw" ? "Raw" : "JSON"}
            </button>
          ))}
        </div>
        <div style={styles.resultMeta}>
          {isSuccess !== undefined && (<span style={{ ...styles.statusBadge, background: isSuccess ? theme.success : theme.error }}>{isSuccess ? "✓ SUCCESS" : "✗ FAIL"}</span>)}
          {result?.elapsedMs !== undefined && (<span style={styles.elapsed}>{result.elapsedMs}ms</span>)}
        </div>
      </div>
      <div style={styles.resultBody}>
        {resultTab === "json" && (<pre style={styles.jsonView}>{JSON.stringify(result, null, 2)}</pre>)}
        {resultTab === "raw" && (<pre style={styles.jsonView}>{result?.rawText || result?.request?.rawText || "미리보기를 실행해주세요"}</pre>)}
        {resultTab === "parsed" && result?.response?.fields && (
          <div style={{ padding: 12 }}>{result.response.fields.map((f, i) => (
            <div key={i} style={styles.parsedRow}><span style={styles.parsedLabel}>{f.fieldNameKr || f.fieldName}</span><span style={styles.parsedValue}>{f.value}</span><span style={styles.parsedMeta}>[{f.offset}:{f.offset + f.length}] {f.length}B</span></div>
          ))}</div>
        )}
        {resultTab === "parsed" && !result?.response?.fields && (<pre style={styles.jsonView}>{JSON.stringify(result, null, 2)}</pre>)}
      </div>
    </div>
  );
}

function HistoryViewer({ history }) {
  if (!history?.length) { return (<div style={styles.emptyState}><div style={{ fontSize: 40, marginBottom: 12 }}>📜</div><div>송수신 이력이 없습니다</div></div>); }
  return (
    <div style={{ padding: 16 }}>{history.map((h, i) => (
      <div key={i} style={styles.historyItem}>
        <div style={styles.historyHeader}><span>{h.telegramId}</span><span style={{ color: h.success ? theme.success : theme.error }}>{h.success ? "✓" : "✗"} {h.elapsedMs}ms</span></div>
        <div style={styles.historyMeta}>{h.protocol} → {h.target} | {h.createdAt}</div>
      </div>
    ))}</div>
  );
}

function getDemoLayout() {
  return [
    { fieldSeq: 1, fieldName: "MSG_LEN", fieldNameKr: "전문길이", fieldLength: 4, dataType: "NUMBER", align: "RIGHT", padChar: "0", defaultValue: "", required: true, section: "HEADER", active: true },
    { fieldSeq: 2, fieldName: "MSG_TYPE", fieldNameKr: "전문구분", fieldLength: 4, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "0200", required: true, section: "HEADER", active: true },
    { fieldSeq: 3, fieldName: "TRAN_CD", fieldNameKr: "거래코드", fieldLength: 6, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "", required: true, section: "HEADER", active: true },
    { fieldSeq: 4, fieldName: "SEND_DATE", fieldNameKr: "전송일자", fieldLength: 8, dataType: "DATE", align: "LEFT", padChar: " ", defaultValue: "", required: true, section: "HEADER", active: true },
    { fieldSeq: 5, fieldName: "SEND_TIME", fieldNameKr: "전송시간", fieldLength: 6, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "", required: false, section: "HEADER", active: true },
    { fieldSeq: 6, fieldName: "RESP_CD", fieldNameKr: "응답코드", fieldLength: 4, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "0000", required: false, section: "HEADER", active: true },
    { fieldSeq: 7, fieldName: "ACCT_NO", fieldNameKr: "계좌번호", fieldLength: 16, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "", required: true, section: "BODY", active: true },
    { fieldSeq: 8, fieldName: "ACCT_NM", fieldNameKr: "예금주명", fieldLength: 20, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "", required: false, section: "BODY", active: true },
    { fieldSeq: 9, fieldName: "TRAN_AMT", fieldNameKr: "거래금액", fieldLength: 13, dataType: "NUMBER", align: "RIGHT", padChar: "0", defaultValue: "0", required: true, section: "BODY", active: true },
    { fieldSeq: 10, fieldName: "CURR_CD", fieldNameKr: "통화코드", fieldLength: 3, dataType: "STRING", align: "LEFT", padChar: " ", defaultValue: "KRW", required: false, section: "BODY", active: true },
    { fieldSeq: 11, fieldName: "FILLER", fieldNameKr: "예비", fieldLength: 16, dataType: "FILLER", align: "LEFT", padChar: " ", defaultValue: "", required: false, section: "BODY", active: true },
  ];
}

const styles = {
  container: { minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: theme.headerBg, borderBottom: `1px solid ${theme.border}` },
  headerLeft: { display: "flex", alignItems: "center", gap: 20 },
  headerRight: { display: "flex", alignItems: "center", gap: 20 },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5 },
  logoBadge: { fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "rgba(59,130,246,0.2)", color: theme.accent, borderRadius: 4, letterSpacing: 1 },
  modeToggle: { display: "flex", gap: 2, background: "rgba(30,41,59,0.8)", borderRadius: 8, padding: 3, border: `1px solid ${theme.border}` },
  modeBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: "transparent", color: theme.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  modeBtnActive: { background: "rgba(59,130,246,0.2)", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" },
  charsetSelect: { display: "flex", alignItems: "center", gap: 6 },
  miniLabel: { fontSize: 11, color: theme.textDim },
  totalLength: { fontSize: 13, color: theme.textDim },
  main: { display: "flex", height: "calc(100vh - 52px)" },
  leftPanel: { width: 360, minWidth: 360, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", overflow: "auto" },
  section: { padding: "16px 16px 12px", borderBottom: `1px solid ${theme.border}` },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: theme.textDim, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  select: { width: "100%", padding: "8px 10px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, outline: "none" },
  selectSmall: { padding: "5px 8px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 12, outline: "none" },
  protocolGrid: { display: "flex", flexDirection: "column", gap: 6 },
  protocolBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, cursor: "pointer", fontSize: 13, transition: "all 0.15s" },
  protocolBtnActive: { background: theme.accentGlow },
  protocolIcon: { fontSize: 16 },
  connForm: { display: "flex", flexDirection: "column", gap: 10 },
  formRow: { display: "flex", gap: 8, alignItems: "flex-end" },
  formGroup: { flex: 1 },
  formGroupSmall: { flex: "0 0 90px" },
  label: { display: "block", fontSize: 11, color: theme.textDim, marginBottom: 4, fontWeight: 600 },
  input: { width: "100%", padding: "7px 10px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 5, color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace" },
  checkboxGroup: { display: "flex", alignItems: "center", height: 34 },
  checkLabel: { display: "flex", alignItems: "center", fontSize: 12, color: theme.textDim, cursor: "pointer" },
  actionBar: { padding: 16, display: "flex", gap: 8, marginTop: "auto", borderTop: `1px solid ${theme.border}` },
  btnPrimary: { flex: 1, padding: "10px 16px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "opacity 0.15s" },
  btnSecondary: { padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 12, cursor: "pointer" },
  btnOutline: { padding: "10px 12px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textDim, fontSize: 12, cursor: "pointer" },
  rightPanel: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  tabs: { display: "flex", borderBottom: `1px solid ${theme.border}`, background: theme.headerBg },
  tab: { padding: "10px 18px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: theme.textDim, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" },
  tabActive: { color: theme.text, borderBottomColor: theme.accent },
  badge: { fontSize: 10, padding: "1px 6px", background: "rgba(59,130,246,0.2)", color: theme.accent, borderRadius: 10 },
  fieldEditor: { flex: 1, overflow: "auto", padding: 0 },
  fieldGroup: { marginBottom: 0 },
  fieldGroupTitle: { padding: "10px 16px", fontSize: 12, fontWeight: 700, color: theme.accent, background: "rgba(59,130,246,0.05)", borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, zIndex: 1 },
  fieldTable: { fontSize: 13 },
  fieldTableHeader: { display: "flex", alignItems: "center", padding: "6px 16px", fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, background: theme.headerBg, borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 36, zIndex: 1 },
  fieldRow: { display: "flex", alignItems: "center", padding: "4px 16px", borderBottom: `1px solid ${theme.border}22`, transition: "background 0.1s" },
  fieldCell: { fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fieldInput: { width: "100%", padding: "5px 8px", background: theme.bg, border: "1px solid transparent", borderRadius: 4, color: theme.text, fontSize: 12, outline: "none", fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box", transition: "border-color 0.15s" },
  rawViewer: { flex: 1, overflow: "auto" },
  rawHeader: { padding: "8px 16px", fontSize: 11, fontWeight: 700, color: theme.textDim, background: theme.headerBg, borderBottom: `1px solid ${theme.border}` },
  rawContent: { padding: 16, lineHeight: 1.8, wordBreak: "break-all" },
  hexDump: { borderTop: `1px solid ${theme.border}` },
  hexContent: { padding: 16, margin: 0, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: theme.textDim, lineHeight: 1.6 },
  resultPanel: { borderTop: `3px solid ${theme.border}`, background: theme.surface, maxHeight: 300, overflow: "auto" },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${theme.border}` },
  resultTabs: { display: "flex" },
  resultTab: { padding: "8px 14px", background: "transparent", border: "none", color: theme.textDim, fontSize: 12, cursor: "pointer", borderBottom: "2px solid transparent" },
  resultTabActive: { color: theme.text, borderBottomColor: theme.accent },
  resultMeta: { display: "flex", alignItems: "center", gap: 10 },
  statusBadge: { padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff" },
  elapsed: { fontSize: 12, color: theme.textDim, fontFamily: "'JetBrains Mono', monospace" },
  resultBody: { overflow: "auto" },
  jsonView: { padding: 16, margin: 0, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: theme.text, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  parsedRow: { display: "flex", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${theme.border}22`, gap: 12 },
  parsedLabel: { flex: "0 0 120px", fontSize: 12, color: theme.textDim },
  parsedValue: { flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" },
  parsedMeta: { fontSize: 10, color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" },
  historyItem: { padding: 12, borderBottom: `1px solid ${theme.border}` },
  historyHeader: { display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 },
  historyMeta: { fontSize: 11, color: theme.textDim, marginTop: 4 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: theme.textDim, fontSize: 14 },
};
