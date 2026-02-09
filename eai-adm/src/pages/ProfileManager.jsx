import { useState } from "react";

const MOCK_PROFILES = [
  { id: 1, profileName: "EAI 개발서버", env: "DEV", protocol: "TCP", host: "10.0.1.50", port: 9090, charset: "EUC-KR", timeoutMs: 30000, includeLengthHeader: true, lengthHeaderSize: 4, active: true, description: "EAI 개발 환경" },
  { id: 2, profileName: "EAI 검증서버", env: "STG", protocol: "TCP", host: "10.0.2.50", port: 9090, charset: "EUC-KR", timeoutMs: 30000, includeLengthHeader: true, lengthHeaderSize: 4, active: true, description: "EAI 검증 환경" },
  { id: 3, profileName: "REST API 개발", env: "DEV", protocol: "HTTP", host: "eai-dev.bank.local", port: 8080, url: "http://eai-dev.bank.local:8080/api/send", charset: "UTF-8", timeoutMs: 15000, active: true, description: "REST 연동 개발 환경" },
  { id: 4, profileName: "MQ 개발서버", env: "DEV", protocol: "MQ", host: "10.0.1.100", port: 1414, charset: "EUC-KR", timeoutMs: 60000, active: false, description: "IBM MQ 개발 환경 (비활성)" },
  { id: 5, profileName: "EAI 운영서버", env: "PRD", protocol: "TCP", host: "10.0.10.50", port: 9090, charset: "EUC-KR", timeoutMs: 10000, includeLengthHeader: true, lengthHeaderSize: 4, active: true, description: "운영 환경 (주의)" },
];

const ENV_COLORS = { DEV: "#36a2eb", STG: "#f5a623", PRD: "#ff6b6b" };
const PROTO_COLORS = { TCP: "#36a2eb", HTTP: "#00bfb3", MQ: "#f5a623" };

export default function ProfileManager() {
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [selectedEnv, setSelectedEnv] = useState("ALL");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ profileName: "", env: "DEV", protocol: "TCP", host: "", port: 9090, url: "", charset: "EUC-KR", timeoutMs: 30000, includeLengthHeader: true, lengthHeaderSize: 4, description: "" });

  const filtered = selectedEnv === "ALL" ? profiles : profiles.filter((p) => p.env === selectedEnv);

  const handleSave = () => {
    if (editId) {
      setProfiles((prev) => prev.map((p) => (p.id === editId ? { ...form, id: editId, active: true } : p)));
    } else {
      setProfiles((prev) => [...prev, { ...form, id: Date.now(), active: true }]);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ profileName: "", env: "DEV", protocol: "TCP", host: "", port: 9090, url: "", charset: "EUC-KR", timeoutMs: 30000, includeLengthHeader: true, lengthHeaderSize: 4, description: "" });
  };

  const handleEdit = (p) => {
    setForm(p);
    setEditId(p.id);
    setShowForm(true);
  };

  const handleToggle = (id) => setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  const handleDelete = (id) => setProfiles((prev) => prev.filter((p) => p.id !== id));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>접속 프로파일</h1>
          <p style={s.subtitle}>환경별 접속 정보 관리</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowForm(!showForm); setEditId(null); }}>+ 프로파일 추가</button>
      </div>

      {/* Env Filter */}
      <div style={s.envTabs}>
        {["ALL", "DEV", "STG", "PRD"].map((env) => (
          <button key={env} onClick={() => setSelectedEnv(env)} style={{
            ...s.envTab,
            ...(selectedEnv === env ? { background: `${ENV_COLORS[env] || "#36a2eb"}18`, borderColor: ENV_COLORS[env] || "#36a2eb", color: ENV_COLORS[env] || "#36a2eb" } : {}),
          }}>
            {env === "ALL" ? "전체" : env}
            <span style={s.envCount}>{env === "ALL" ? profiles.length : profiles.filter((p) => p.env === env).length}</span>
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formTitle}>{editId ? "프로파일 수정" : "새 프로파일"}</div>
          <div style={s.formGrid}>
            <div style={s.formCol}>
              <label style={s.label}>프로파일명</label>
              <input style={s.input} value={form.profileName} onChange={(e) => setForm({ ...form, profileName: e.target.value })} />
            </div>
            <div style={s.formCol}>
              <label style={s.label}>환경</label>
              <select style={s.select} value={form.env} onChange={(e) => setForm({ ...form, env: e.target.value })}>
                <option>DEV</option><option>STG</option><option>PRD</option>
              </select>
            </div>
            <div style={s.formCol}>
              <label style={s.label}>프로토콜</label>
              <select style={s.select} value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                <option>TCP</option><option>HTTP</option><option>MQ</option>
              </select>
            </div>
            <div style={s.formCol}>
              <label style={s.label}>Host</label>
              <input style={s.input} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="10.0.1.50" />
            </div>
            <div style={s.formCol}>
              <label style={s.label}>Port</label>
              <input style={s.input} type="number" value={form.port} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 0 })} />
            </div>
            <div style={s.formCol}>
              <label style={s.label}>Charset</label>
              <select style={s.select} value={form.charset} onChange={(e) => setForm({ ...form, charset: e.target.value })}>
                <option>EUC-KR</option><option>UTF-8</option><option>MS949</option>
              </select>
            </div>
            <div style={s.formCol}>
              <label style={s.label}>Timeout (ms)</label>
              <input style={s.input} type="number" value={form.timeoutMs} onChange={(e) => setForm({ ...form, timeoutMs: parseInt(e.target.value) || 30000 })} />
            </div>
            <div style={{ ...s.formCol, gridColumn: "span 2" }}>
              <label style={s.label}>설명</label>
              <input style={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => setShowForm(false)}>취소</button>
            <button style={s.saveBtn} onClick={handleSave}>저장</button>
          </div>
        </div>
      )}

      {/* Profile Cards */}
      <div style={s.cardGrid}>
        {filtered.map((p) => (
          <div key={p.id} style={{ ...s.profileCard, opacity: p.active ? 1 : 0.5, borderLeft: `4px solid ${ENV_COLORS[p.env]}` }}>
            <div style={s.cardHeader}>
              <span style={s.cardName}>{p.profileName}</span>
              <div style={s.cardBadges}>
                <span style={{ ...s.envBadge, background: `${ENV_COLORS[p.env]}18`, color: ENV_COLORS[p.env] }}>{p.env}</span>
                <span style={{ ...s.protoBadge, background: `${PROTO_COLORS[p.protocol]}18`, color: PROTO_COLORS[p.protocol] }}>{p.protocol}</span>
              </div>
            </div>
            <div style={s.cardBody}>
              <div style={s.cardRow}><span style={s.cardLabel}>Host</span><span style={s.cardValue}>{p.host}:{p.port}</span></div>
              {p.url && <div style={s.cardRow}><span style={s.cardLabel}>URL</span><span style={s.cardValue}>{p.url}</span></div>}
              <div style={s.cardRow}><span style={s.cardLabel}>Charset</span><span>{p.charset}</span></div>
              <div style={s.cardRow}><span style={s.cardLabel}>Timeout</span><span>{p.timeoutMs}ms</span></div>
              {p.description && <div style={s.cardDesc}>{p.description}</div>}
            </div>
            <div style={s.cardActions}>
              <button style={s.cardBtn} onClick={() => handleToggle(p.id)}>{p.active ? "비활성" : "활성"}</button>
              <button style={s.cardBtn} onClick={() => handleEdit(p)}>수정</button>
              <button style={{ ...s.cardBtn, color: "#ff6b6b" }} onClick={() => handleDelete(p.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { padding: "24px 28px", animation: "fadeIn 0.3s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: "#e8eaed" },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  addBtn: { padding: "8px 16px", background: "linear-gradient(135deg, #36a2eb, #00bfb3)", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" },

  envTabs: { display: "flex", gap: 8, marginBottom: 20 },
  envTab: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#232440", border: "1px solid #2d2e4a", borderRadius: 6, color: "#5c5f73", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  envCount: { fontSize: 10, padding: "1px 5px", background: "#1a1b2e", borderRadius: 8 },

  formCard: { background: "#232440", borderRadius: 10, padding: 24, marginBottom: 20, border: "1px solid #2d2e4a" },
  formTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#e8eaed" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  formCol: {},
  label: { display: "block", fontSize: 11, color: "#5c5f73", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  input: { width: "100%", padding: "8px 10px", background: "#1a1b2e", border: "1px solid #2d2e4a", borderRadius: 5, color: "#e8eaed", fontSize: 13, outline: "none", fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#1a1b2e", border: "1px solid #2d2e4a", borderRadius: 5, color: "#e8eaed", fontSize: 13, outline: "none", boxSizing: "border-box" },
  formActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  cancelBtn: { padding: "8px 16px", background: "transparent", border: "1px solid #2d2e4a", borderRadius: 5, color: "#9ea2b0", fontSize: 12, cursor: "pointer" },
  saveBtn: { padding: "8px 20px", background: "#36a2eb", border: "none", borderRadius: 5, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  profileCard: { background: "#232440", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", transition: "opacity 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #2d2e4a" },
  cardName: { fontSize: 14, fontWeight: 600 },
  cardBadges: { display: "flex", gap: 6 },
  envBadge: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5 },
  protoBadge: { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 3 },
  cardBody: { padding: "12px 18px" },
  cardRow: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 },
  cardLabel: { color: "#5c5f73", fontSize: 12 },
  cardValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },
  cardDesc: { marginTop: 8, fontSize: 12, color: "#5c5f73", fontStyle: "italic" },
  cardActions: { display: "flex", gap: 0, borderTop: "1px solid #2d2e4a" },
  cardBtn: { flex: 1, padding: "8px", background: "transparent", border: "none", borderRight: "1px solid #2d2e4a", color: "#9ea2b0", fontSize: 11, cursor: "pointer", fontWeight: 500 },
};
