import { useState } from "react";

const MOCK_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  id: 30 - i,
  telegramId: ["TR0001", "INQ001", "TR0002", "FX0001"][i % 4],
  telegramName: ["계좌이체", "잔액조회", "타행이체", "환율조회"][i % 4],
  protocol: ["TCP", "HTTP", "MQ"][i % 3],
  direction: "SEND",
  target: ["10.0.1.50:9090", "http://eai-dev:8080/api", "QM_DEV/REQ.QUEUE"][i % 3],
  success: Math.random() > 0.15,
  elapsedMs: Math.floor(Math.random() * 600) + 30,
  responseCode: Math.random() > 0.15 ? "0000" : "9999",
  createdAt: new Date(Date.now() - i * 300000).toISOString(),
  rawRequest: "00840200TR0001202402091234560000",
  rawResponse: "00840210TR0001202402091234560000",
}));

export default function HistoryPage() {
  const [history] = useState(MOCK_HISTORY);
  const [filter, setFilter] = useState({ protocol: "ALL", status: "ALL", search: "" });
  const [selectedId, setSelectedId] = useState(null);

  const filtered = history.filter((h) => {
    if (filter.protocol !== "ALL" && h.protocol !== filter.protocol) return false;
    if (filter.status === "SUCCESS" && !h.success) return false;
    if (filter.status === "FAIL" && h.success) return false;
    if (filter.search && !h.telegramId.includes(filter.search.toUpperCase()) && !h.telegramName.includes(filter.search)) return false;
    return true;
  });

  const selected = history.find((h) => h.id === selectedId);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>송수신 이력</h1>
          <p style={s.subtitle}>전문 송수신 기록 조회 및 분석</p>
        </div>
        <div style={s.headerStats}>
          <span style={s.headerStat}>전체 <strong>{history.length}</strong></span>
          <span style={{ ...s.headerStat, color: "#00bfb3" }}>성공 <strong>{history.filter((h) => h.success).length}</strong></span>
          <span style={{ ...s.headerStat, color: "#ff6b6b" }}>실패 <strong>{history.filter((h) => !h.success).length}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <input style={s.searchInput} placeholder="전문코드 또는 전문명 검색..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
        <div style={s.filterGroup}>
          {["ALL", "TCP", "HTTP", "MQ"].map((p) => (
            <button key={p} onClick={() => setFilter({ ...filter, protocol: p })} style={{ ...s.filterBtn, ...(filter.protocol === p ? s.filterBtnActive : {}) }}>
              {p === "ALL" ? "전체" : p}
            </button>
          ))}
        </div>
        <div style={s.filterGroup}>
          {["ALL", "SUCCESS", "FAIL"].map((st) => (
            <button key={st} onClick={() => setFilter({ ...filter, status: st })} style={{
              ...s.filterBtn,
              ...(filter.status === st ? { ...s.filterBtnActive, background: st === "SUCCESS" ? "#00bfb318" : st === "FAIL" ? "#ff6b6b18" : "#36a2eb18", borderColor: st === "SUCCESS" ? "#00bfb3" : st === "FAIL" ? "#ff6b6b" : "#36a2eb", color: st === "SUCCESS" ? "#00bfb3" : st === "FAIL" ? "#ff6b6b" : "#36a2eb" } : {}),
            }}>
              {st === "ALL" ? "전체" : st === "SUCCESS" ? "✓ 성공" : "✕ 실패"}
            </button>
          ))}
        </div>
      </div>

      <div style={s.content}>
        {/* List */}
        <div style={s.listPanel}>
          <div style={s.listHeader}>
            <span style={{ width: 30 }}>#</span>
            <span style={{ width: 70 }}>전문코드</span>
            <span style={{ flex: 1 }}>전문명</span>
            <span style={{ width: 45 }}>프로토콜</span>
            <span style={{ width: 55 }}>상태</span>
            <span style={{ width: 60 }}>응답시간</span>
            <span style={{ width: 120 }}>일시</span>
          </div>
          {filtered.map((h) => (
            <div key={h.id} onClick={() => setSelectedId(h.id)} style={{ ...s.listRow, ...(selectedId === h.id ? s.listRowActive : {}), cursor: "pointer" }}>
              <span style={{ width: 30, color: "#5c5f73", fontSize: 11 }}>{h.id}</span>
              <span style={{ width: 70, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>{h.telegramId}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{h.telegramName}</span>
              <span style={{ width: 45 }}>
                <span style={{ ...s.protoBadge, background: h.protocol === "TCP" ? "#36a2eb18" : h.protocol === "HTTP" ? "#00bfb318" : "#f5a62318", color: h.protocol === "TCP" ? "#36a2eb" : h.protocol === "HTTP" ? "#00bfb3" : "#f5a623" }}>{h.protocol}</span>
              </span>
              <span style={{ width: 55 }}>
                <span style={{ ...s.statusBadge, background: h.success ? "#00bfb318" : "#ff6b6b18", color: h.success ? "#00bfb3" : "#ff6b6b" }}>
                  {h.success ? "성공" : "실패"}
                </span>
              </span>
              <span style={{ width: 60, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: h.elapsedMs > 300 ? "#f5a623" : "#9ea2b0" }}>{h.elapsedMs}ms</span>
              <span style={{ width: 120, fontSize: 11, color: "#5c5f73" }}>
                {new Date(h.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={s.detailPanel}>
            <div style={s.detailHeader}>
              <span style={s.detailTitle}>#{selected.id} {selected.telegramId}</span>
              <span style={{ ...s.statusBadge, background: selected.success ? "#00bfb318" : "#ff6b6b18", color: selected.success ? "#00bfb3" : "#ff6b6b" }}>
                {selected.success ? "✓ SUCCESS" : "✕ FAIL"}
              </span>
            </div>
            <div style={s.detailMeta}>
              <div style={s.metaItem}><span style={s.metaLabel}>프로토콜</span><span>{selected.protocol}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>대상</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{selected.target}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>응답시간</span><span>{selected.elapsedMs}ms</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>응답코드</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: selected.responseCode === "0000" ? "#00bfb3" : "#ff6b6b" }}>{selected.responseCode}</span></div>
            </div>
            <div style={s.rawSection}>
              <div style={s.rawLabel}>Request</div>
              <pre style={s.rawContent}>{selected.rawRequest}</pre>
            </div>
            <div style={s.rawSection}>
              <div style={s.rawLabel}>Response</div>
              <pre style={s.rawContent}>{selected.rawResponse}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { padding: "24px 28px", animation: "fadeIn 0.3s ease", height: "100vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: "#e8eaed" },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  headerStats: { display: "flex", gap: 16 },
  headerStat: { fontSize: 12, color: "#9ea2b0" },

  filterRow: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" },
  searchInput: { padding: "8px 12px", background: "#232440", border: "1px solid #2d2e4a", borderRadius: 6, color: "#e8eaed", fontSize: 13, outline: "none", width: 240, fontFamily: "'IBM Plex Sans', sans-serif" },
  filterGroup: { display: "flex", gap: 4 },
  filterBtn: { padding: "6px 12px", background: "transparent", border: "1px solid #2d2e4a", borderRadius: 4, color: "#5c5f73", fontSize: 11, cursor: "pointer", fontWeight: 500 },
  filterBtnActive: { background: "#36a2eb18", borderColor: "#36a2eb", color: "#36a2eb" },

  content: { display: "flex", gap: 16, flex: 1, overflow: "hidden" },
  listPanel: { flex: 1, background: "#232440", borderRadius: 10, overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  listHeader: { display: "flex", alignItems: "center", padding: "10px 16px", background: "#1d1e33", borderBottom: "1px solid #2d2e4a", fontSize: 10, fontWeight: 600, color: "#5c5f73", textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", top: 0, zIndex: 1 },
  listRow: { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #2d2e4a18", fontSize: 13, color: "#e8eaed", transition: "background 0.1s" },
  listRowActive: { background: "#36a2eb10", borderLeft: "3px solid #36a2eb" },
  protoBadge: { fontSize: 9, fontWeight: 600, padding: "2px 5px", borderRadius: 3, letterSpacing: 0.3 },
  statusBadge: { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 3 },

  detailPanel: { width: 340, background: "#232440", borderRadius: 10, padding: 20, overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", animation: "slideInRight 0.2s ease" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #2d2e4a" },
  detailTitle: { fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  detailMeta: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  metaItem: { display: "flex", justifyContent: "space-between", fontSize: 13 },
  metaLabel: { color: "#5c5f73", fontSize: 12 },
  rawSection: { marginBottom: 12 },
  rawLabel: { fontSize: 11, fontWeight: 600, color: "#36a2eb", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  rawContent: { background: "#1a1b2e", borderRadius: 6, padding: 12, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#9ea2b0", lineHeight: 1.6, margin: 0, wordBreak: "break-all", whiteSpace: "pre-wrap" },
};
