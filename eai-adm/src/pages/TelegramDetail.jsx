import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MOCK_DETAIL = {
  id: 15,
  telegramId: "TR0001",
  telegramName: "계좌이체",
  protocol: "TCP",
  target: "10.0.1.50:9090",
  direction: "SEND",
  success: true,
  elapsedMs: 142,
  responseCode: "0000",
  createdAt: "2026-02-09T14:30:22",
  requestFields: [
    { fieldName: "MSG_LEN", fieldNameKr: "전문길이", value: "0150", rawValue: "0150", offset: 0, length: 4, section: "HEADER", dataType: "NUMBER" },
    { fieldName: "MSG_TYPE", fieldNameKr: "전문구분", value: "0200", rawValue: "0200", offset: 4, length: 4, section: "HEADER", dataType: "STRING" },
    { fieldName: "TRAN_CD", fieldNameKr: "거래코드", value: "TR0001", rawValue: "TR0001", offset: 8, length: 6, section: "HEADER", dataType: "STRING" },
    { fieldName: "SEND_DATE", fieldNameKr: "전송일자", value: "20260209", rawValue: "20260209", offset: 14, length: 8, section: "HEADER", dataType: "DATE" },
    { fieldName: "SEND_TIME", fieldNameKr: "전송시간", value: "143022", rawValue: "143022", offset: 22, length: 6, section: "HEADER", dataType: "STRING" },
    { fieldName: "RESP_CD", fieldNameKr: "응답코드", value: "0000", rawValue: "0000", offset: 28, length: 4, section: "HEADER", dataType: "STRING" },
    { fieldName: "CHANNEL_ID", fieldNameKr: "채널구분", value: "IB", rawValue: "IB", offset: 32, length: 2, section: "HEADER", dataType: "STRING" },
    { fieldName: "OUT_ACCT_NO", fieldNameKr: "출금계좌번호", value: "1234567890123", rawValue: "1234567890123   ", offset: 34, length: 16, section: "BODY", dataType: "STRING" },
    { fieldName: "IN_ACCT_NO", fieldNameKr: "입금계좌번호", value: "9876543210987", rawValue: "9876543210987   ", offset: 50, length: 16, section: "BODY", dataType: "STRING" },
    { fieldName: "IN_BANK_CD", fieldNameKr: "입금은행코드", value: "088", rawValue: "088", offset: 66, length: 3, section: "BODY", dataType: "STRING" },
    { fieldName: "TRAN_AMT", fieldNameKr: "이체금액", value: "500000", rawValue: "0000000500000", offset: 69, length: 13, section: "BODY", dataType: "NUMBER" },
    { fieldName: "OUT_ACCT_NM", fieldNameKr: "출금예금주", value: "오성민", rawValue: "오성민              ", offset: 82, length: 20, section: "BODY", dataType: "STRING" },
    { fieldName: "IN_ACCT_NM", fieldNameKr: "입금예금주", value: "홍길동", rawValue: "홍길동              ", offset: 102, length: 20, section: "BODY", dataType: "STRING" },
    { fieldName: "MEMO", fieldNameKr: "적요", value: "월세", rawValue: "월세                ", offset: 122, length: 20, section: "BODY", dataType: "STRING" },
    { fieldName: "FILLER", fieldNameKr: "예비", value: "", rawValue: "        ", offset: 142, length: 8, section: "BODY", dataType: "FILLER" },
  ],
  responseFields: [
    { fieldName: "MSG_LEN", fieldNameKr: "전문길이", value: "0150", offset: 0, length: 4, section: "HEADER" },
    { fieldName: "MSG_TYPE", fieldNameKr: "전문구분", value: "0210", offset: 4, length: 4, section: "HEADER" },
    { fieldName: "TRAN_CD", fieldNameKr: "거래코드", value: "TR0001", offset: 8, length: 6, section: "HEADER" },
    { fieldName: "SEND_DATE", fieldNameKr: "전송일자", value: "20260209", offset: 14, length: 8, section: "HEADER" },
    { fieldName: "SEND_TIME", fieldNameKr: "전송시간", value: "143022", offset: 22, length: 6, section: "HEADER" },
    { fieldName: "RESP_CD", fieldNameKr: "응답코드", value: "0000", offset: 28, length: 4, section: "HEADER" },
    { fieldName: "CHANNEL_ID", fieldNameKr: "채널구분", value: "IB", offset: 32, length: 2, section: "HEADER" },
    { fieldName: "OUT_ACCT_NO", fieldNameKr: "출금계좌번호", value: "1234567890123", offset: 34, length: 16, section: "BODY" },
    { fieldName: "IN_ACCT_NO", fieldNameKr: "입금계좌번호", value: "9876543210987", offset: 50, length: 16, section: "BODY" },
    { fieldName: "IN_BANK_CD", fieldNameKr: "입금은행코드", value: "088", offset: 66, length: 3, section: "BODY" },
    { fieldName: "TRAN_AMT", fieldNameKr: "이체금액", value: "500000", offset: 69, length: 13, section: "BODY" },
    { fieldName: "OUT_ACCT_NM", fieldNameKr: "출금예금주", value: "오성민", offset: 82, length: 20, section: "BODY" },
    { fieldName: "IN_ACCT_NM", fieldNameKr: "입금예금주", value: "홍길동", offset: 102, length: 20, section: "BODY" },
    { fieldName: "MEMO", fieldNameKr: "적요", value: "월세", offset: 122, length: 20, section: "BODY" },
    { fieldName: "FILLER", fieldNameKr: "예비", value: "", offset: 142, length: 8, section: "BODY" },
  ],
};

const FIELD_COLORS = ["#36a2eb", "#00bfb3", "#f5a623", "#9170f2", "#ee78a0", "#00bcd4", "#ffd666", "#ff6b6b", "#84cc16", "#c084fc", "#fb923c", "#38bdf8", "#a3e635", "#f472b6", "#22d3ee"];

export default function TelegramDetail() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("compare");
  const data = MOCK_DETAIL;

  const rawRequest = data.requestFields.map((f) => f.rawValue).join("");
  const rawResponse = data.responseFields.map((f) => f.rawValue || f.value).join("");

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate("/history")}>← 이력</button>
          <div>
            <div style={s.titleRow}>
              <h1 style={s.title}>#{data.id} {data.telegramId}</h1>
              <span style={{ ...s.statusBadge, background: data.success ? "#00bfb318" : "#ff6b6b18", color: data.success ? "#00bfb3" : "#ff6b6b" }}>
                {data.success ? "✓ SUCCESS" : "✕ FAIL"}
              </span>
            </div>
            <p style={s.subtitle}>{data.telegramName}</p>
          </div>
        </div>
        <div style={s.metaRow}>
          <div style={s.metaChip}><span style={s.metaLabel}>Protocol</span><span style={{ color: "#36a2eb", fontWeight: 600 }}>{data.protocol}</span></div>
          <div style={s.metaChip}><span style={s.metaLabel}>Target</span><span style={s.mono}>{data.target}</span></div>
          <div style={s.metaChip}><span style={s.metaLabel}>Response</span><span style={{ ...s.mono, color: data.elapsedMs > 300 ? "#f5a623" : "#00bfb3" }}>{data.elapsedMs}ms</span></div>
          <div style={s.metaChip}><span style={s.metaLabel}>Code</span><span style={{ ...s.mono, color: data.responseCode === "0000" ? "#00bfb3" : "#ff6b6b" }}>{data.responseCode}</span></div>
          <div style={s.metaChip}><span style={s.metaLabel}>Time</span><span style={s.mono}>{new Date(data.createdAt).toLocaleString("ko-KR")}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: "compare", label: "요청/응답 비교" },
          { key: "request", label: "요청 상세" },
          { key: "response", label: "응답 상세" },
          { key: "raw", label: "Raw 전문" },
          { key: "hex", label: "Hex Dump" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={s.content}>
        {tab === "compare" && <CompareView req={data.requestFields} res={data.responseFields} />}
        {tab === "request" && <FieldTable fields={data.requestFields} title="Request Fields" />}
        {tab === "response" && <FieldTable fields={data.responseFields} title="Response Fields" />}
        {tab === "raw" && <RawView rawReq={rawRequest} rawRes={rawResponse} reqFields={data.requestFields} resFields={data.responseFields} />}
        {tab === "hex" && <HexView raw={rawRequest} fields={data.requestFields} label="Request" />}
      </div>
    </div>
  );
}

/* ===== Compare View ===== */
function CompareView({ req, res }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  return (
    <div style={s.card}>
      <div style={s.compareHead}>
        <span style={{ width: 36, textAlign: "center" }}>#</span>
        <span style={{ width: 46 }}>섹션</span>
        <span style={{ width: 110 }}>필드명</span>
        <span style={{ width: 90 }}>한글명</span>
        <span style={{ width: 50, textAlign: "right" }}>Offset</span>
        <span style={{ width: 40, textAlign: "right" }}>Len</span>
        <span style={{ flex: 1, textAlign: "center", color: "#36a2eb" }}>⬆ 요청값</span>
        <span style={{ flex: 1, textAlign: "center", color: "#00bfb3" }}>⬇ 응답값</span>
        <span style={{ width: 44, textAlign: "center" }}>Diff</span>
      </div>
      {req.map((rf, i) => {
        const resField = res[i];
        const isDiff = resField && rf.value !== resField.value;
        return (
          <div key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              ...s.compareRow,
              background: hoveredIdx === i ? "#2a2b4a" : isDiff ? "#ff6b6b08" : "transparent",
              borderLeft: isDiff ? "3px solid #f5a623" : "3px solid transparent",
            }}>
            <span style={{ width: 36, textAlign: "center", color: "#5c5f73", fontSize: 11 }}>{i + 1}</span>
            <span style={{ width: 46 }}>
              <span style={{ ...s.sectionTag, background: rf.section === "HEADER" ? "#36a2eb15" : "#f5a62315", color: rf.section === "HEADER" ? "#36a2eb" : "#f5a623" }}>
                {rf.section === "HEADER" ? "H" : "B"}
              </span>
            </span>
            <span style={{ width: 110, ...s.mono, fontSize: 11, color: FIELD_COLORS[i % FIELD_COLORS.length] }}>{rf.fieldName}</span>
            <span style={{ width: 90, fontSize: 12 }}>{rf.fieldNameKr}</span>
            <span style={{ width: 50, ...s.mono, fontSize: 11, color: "#5c5f73", textAlign: "right" }}>{rf.offset}</span>
            <span style={{ width: 40, ...s.mono, fontSize: 11, color: "#5c5f73", textAlign: "right" }}>{rf.length}</span>
            <span style={{ flex: 1, textAlign: "center", ...s.mono, fontSize: 12, color: "#e8eaed" }}>{rf.value || <span style={{ color: "#5c5f7366" }}>—</span>}</span>
            <span style={{ flex: 1, textAlign: "center", ...s.mono, fontSize: 12, color: isDiff ? "#f5a623" : "#e8eaed" }}>{resField?.value || <span style={{ color: "#5c5f7366" }}>—</span>}</span>
            <span style={{ width: 44, textAlign: "center", fontSize: 12 }}>
              {isDiff ? <span style={{ color: "#f5a623", fontWeight: 700 }}>≠</span> : <span style={{ color: "#5c5f7333" }}>＝</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Field Table ===== */
function FieldTable({ fields, title }) {
  return (
    <div style={s.card}>
      <div style={s.fieldHead}>
        <span style={{ width: 36, textAlign: "center" }}>#</span>
        <span style={{ width: 46 }}>섹션</span>
        <span style={{ width: 120 }}>필드명</span>
        <span style={{ width: 100 }}>한글명</span>
        <span style={{ width: 60 }}>타입</span>
        <span style={{ width: 50, textAlign: "right" }}>Offset</span>
        <span style={{ width: 40, textAlign: "right" }}>Len</span>
        <span style={{ flex: 1 }}>값</span>
        <span style={{ flex: 1 }}>Raw</span>
      </div>
      {fields.map((f, i) => (
        <div key={i} style={s.fieldRow}>
          <span style={{ width: 36, textAlign: "center", color: "#5c5f73", fontSize: 11 }}>{i + 1}</span>
          <span style={{ width: 46 }}>
            <span style={{ ...s.sectionTag, background: f.section === "HEADER" ? "#36a2eb15" : "#f5a62315", color: f.section === "HEADER" ? "#36a2eb" : "#f5a623" }}>
              {f.section === "HEADER" ? "HDR" : "BDY"}
            </span>
          </span>
          <span style={{ width: 120, ...s.mono, fontSize: 11, color: FIELD_COLORS[i % FIELD_COLORS.length] }}>{f.fieldName}</span>
          <span style={{ width: 100, fontSize: 12 }}>{f.fieldNameKr}</span>
          <span style={{ width: 60 }}>
            <span style={s.typeBadge}>{f.dataType || "STRING"}</span>
          </span>
          <span style={{ width: 50, ...s.mono, fontSize: 11, color: "#5c5f73", textAlign: "right" }}>{f.offset}</span>
          <span style={{ width: 40, ...s.mono, fontSize: 11, color: "#36a2eb", textAlign: "right" }}>{f.length}</span>
          <span style={{ flex: 1, ...s.mono, fontSize: 12 }}>{f.value || <span style={{ color: "#5c5f7344" }}>empty</span>}</span>
          <span style={{ flex: 1, ...s.mono, fontSize: 10, color: "#9ea2b0", background: "#1a1b2e", padding: "2px 6px", borderRadius: 3, overflowX: "auto", whiteSpace: "nowrap" }}>{f.rawValue || ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ===== Raw View with colored highlight ===== */
function RawView({ rawReq, rawRes, reqFields, resFields }) {
  const buildHighlighted = (raw, fields) => {
    const spans = [];
    let pos = 0;
    fields.forEach((f, i) => {
      const chunk = raw.substring(pos, pos + f.length);
      spans.push(
        <span
          key={i}
          title={`${f.fieldName} (${f.fieldNameKr}) [${f.offset}:${f.length}]`}
          style={{ color: FIELD_COLORS[i % FIELD_COLORS.length], background: `${FIELD_COLORS[i % FIELD_COLORS.length]}12`, padding: "1px 0", borderRadius: 2, cursor: "help" }}
        >{chunk}</span>
      );
      pos += f.length;
    });
    if (pos < raw.length) spans.push(<span key="tail" style={{ color: "#5c5f73" }}>{raw.substring(pos)}</span>);
    return spans;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.card}>
        <div style={s.rawHeader}>⬆ Request <span style={{ color: "#5c5f73", fontWeight: 400 }}>({rawReq.length} bytes)</span></div>
        <pre style={s.rawPre}>{buildHighlighted(rawReq, reqFields)}</pre>
        <div style={s.fieldLegend}>
          {reqFields.map((f, i) => (
            <span key={i} style={{ ...s.legendTag, color: FIELD_COLORS[i % FIELD_COLORS.length], borderColor: `${FIELD_COLORS[i % FIELD_COLORS.length]}44` }}>
              {f.fieldName}({f.length})
            </span>
          ))}
        </div>
      </div>
      <div style={s.card}>
        <div style={s.rawHeader}>⬇ Response <span style={{ color: "#5c5f73", fontWeight: 400 }}>({rawRes.length} bytes)</span></div>
        <pre style={s.rawPre}>{buildHighlighted(rawRes, resFields)}</pre>
      </div>
    </div>
  );
}

/* ===== Hex Dump ===== */
function HexView({ raw, fields, label }) {
  const bytes = [];
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    bytes.push(code.toString(16).padStart(2, "0").toUpperCase());
  }

  // Map each byte to field color
  const byteColors = [];
  let pos = 0;
  fields.forEach((f, fi) => {
    for (let j = 0; j < f.length && pos < bytes.length; j++) {
      byteColors.push(FIELD_COLORS[fi % FIELD_COLORS.length]);
      pos++;
    }
  });
  while (byteColors.length < bytes.length) byteColors.push("#5c5f73");

  const rows = [];
  for (let i = 0; i < bytes.length; i += 16) {
    rows.push({
      offset: i.toString(16).padStart(8, "0").toUpperCase(),
      hex: bytes.slice(i, i + 16),
      colors: byteColors.slice(i, i + 16),
      ascii: raw.substring(i, i + 16).replace(/[^\x20-\x7E]/g, "."),
    });
  }

  return (
    <div style={s.card}>
      <div style={s.rawHeader}>Hex Dump — {label}</div>
      <div style={{ overflowX: "auto" }}>
        <pre style={{ ...s.rawPre, lineHeight: 2 }}>
          <span style={{ color: "#5c5f73" }}>{"OFFSET   00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  ASCII\n"}</span>
          <span style={{ color: "#2d2e4a" }}>{"─".repeat(76) + "\n"}</span>
          {rows.map((row, ri) => (
            <span key={ri}>
              <span style={{ color: "#5c5f73" }}>{row.offset}  </span>
              {row.hex.map((b, bi) => (
                <span key={bi}>
                  <span style={{ color: row.colors[bi] }}>{b}</span>
                  {bi === 7 ? "  " : " "}
                </span>
              ))}
              {"  ".repeat(Math.max(0, 16 - row.hex.length))}
              {"  "}
              <span style={{ color: "#9ea2b0" }}>{row.ascii}</span>
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}

const s = {
  page: { padding: "24px 28px", animation: "fadeIn 0.3s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  backBtn: { padding: "6px 12px", background: "#232440", border: "1px solid #2d2e4a", borderRadius: 6, color: "#9ea2b0", fontSize: 12, cursor: "pointer" },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: 700, color: "#e8eaed", fontFamily: "'JetBrains Mono', monospace" },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4 },
  metaRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaChip: { display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#232440", borderRadius: 5, fontSize: 12 },
  metaLabel: { color: "#5c5f73", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  mono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },

  tabs: { display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #2d2e4a", paddingBottom: 0 },
  tab: { padding: "10px 18px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#5c5f73", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" },
  tabActive: { color: "#36a2eb", borderBottomColor: "#36a2eb" },

  content: { animation: "fadeIn 0.2s ease" },
  card: { background: "#232440", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", marginBottom: 16 },

  compareHead: { display: "flex", alignItems: "center", padding: "10px 14px", background: "#1d1e33", borderBottom: "1px solid #2d2e4a", fontSize: 10, fontWeight: 600, color: "#5c5f73", textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", top: 0, zIndex: 1 },
  compareRow: { display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #2d2e4a15", fontSize: 13, color: "#e8eaed", transition: "background 0.1s" },

  fieldHead: { display: "flex", alignItems: "center", padding: "10px 14px", background: "#1d1e33", borderBottom: "1px solid #2d2e4a", fontSize: 10, fontWeight: 600, color: "#5c5f73", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldRow: { display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #2d2e4a15", fontSize: 13, color: "#e8eaed", gap: 0 },

  sectionTag: { fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, letterSpacing: 0.3 },
  typeBadge: { fontSize: 9, fontWeight: 500, padding: "2px 5px", borderRadius: 3, background: "#1a1b2e", color: "#9ea2b0" },

  rawHeader: { padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#36a2eb", borderBottom: "1px solid #2d2e4a" },
  rawPre: { padding: "16px", margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#1a1b2e" },
  fieldLegend: { display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 16px", borderTop: "1px solid #2d2e4a" },
  legendTag: { fontSize: 9, padding: "2px 6px", border: "1px solid", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" },
};
