import { useState, useEffect } from "react";

const API_BASE = "/api/layout";
const TELEGRAM_API = "/api/telegram";

export default function LayoutManager() {
  const [layouts, setLayouts] = useState([]);
  const [selectedTelegram, setSelectedTelegram] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [showAddTelegram, setShowAddTelegram] = useState(false);
  const [newField, setNewField] = useState({ fieldName: "", fieldNameKr: "", fieldLength: 0, dataType: "STRING", align: "LEFT", padChar: " ", section: "BODY", required: false });
  const [newTelegram, setNewTelegram] = useState({ telegramId: "", telegramName: "" });
  const [loading, setLoading] = useState(false);

  // 레이아웃 전체 로드
  const loadLayouts = () => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLayouts(list);
        if (list.length > 0 && !selectedTelegram) {
          setSelectedTelegram(list[0].telegramId);
        }
      })
      .catch(() => {
        // 로컬 샘플 fallback
        const sample = getSampleLayouts();
        setLayouts(sample);
        if (!selectedTelegram) setSelectedTelegram("TR0001");
      });
  };

  useEffect(() => {
    loadLayouts();
  }, []);

  const telegrams = [...new Set(layouts.map((l) => l.telegramId))];
  const filtered = layouts.filter((l) => l.telegramId === selectedTelegram);
  const totalLength = filtered.reduce((s, f) => s + f.fieldLength, 0);
  const headerLen = filtered.filter((f) => f.section === "HEADER").reduce((s, f) => s + f.fieldLength, 0);
  const bodyLen = filtered.filter((f) => f.section === "BODY").reduce((s, f) => s + f.fieldLength, 0);

  // 필드 추가
  const handleAddField = async () => {
    if (!newField.fieldName || !newField.fieldLength) return alert("필드명과 길이를 입력해주세요.");
    const maxSeq = Math.max(0, ...filtered.map((f) => f.fieldSeq));
    const payload = {
      ...newField,
      telegramId: selectedTelegram,
      telegramName: filtered[0]?.telegramName || selectedTelegram,
      fieldSeq: maxSeq + 1,
      active: true,
    };
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        loadLayouts();
        setNewField({ fieldName: "", fieldNameKr: "", fieldLength: 0, dataType: "STRING", align: "LEFT", padChar: " ", section: "BODY", required: false });
        setShowAddField(false);
      }
    } catch {
      // fallback: 로컬 추가
      setLayouts((prev) => [...prev, { ...payload, id: Date.now() }]);
      setShowAddField(false);
    }
    setLoading(false);
  };

  // 새 전문 추가 (첫 필드 하나와 함께 등록)
  const handleAddTelegram = async () => {
    if (!newTelegram.telegramId || !newTelegram.telegramName) return alert("전문코드와 전문명을 입력해주세요.");
    if (telegrams.includes(newTelegram.telegramId)) return alert("이미 존재하는 전문코드입니다.");

    const payload = {
      telegramId: newTelegram.telegramId,
      telegramName: newTelegram.telegramName,
      fieldSeq: 1,
      fieldName: "MSG_LEN",
      fieldNameKr: "전문길이",
      fieldLength: 4,
      dataType: "NUMBER",
      align: "RIGHT",
      padChar: "0",
      section: "HEADER",
      required: true,
      active: true,
    };
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        loadLayouts();
        setSelectedTelegram(newTelegram.telegramId);
        setNewTelegram({ telegramId: "", telegramName: "" });
        setShowAddTelegram(false);
      }
    } catch {
      // fallback: 로컬 추가
      setLayouts((prev) => [...prev, { ...payload, id: Date.now() }]);
      setSelectedTelegram(newTelegram.telegramId);
      setShowAddTelegram(false);
    }
    setLoading(false);
  };

  // 필드 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      loadLayouts();
    } catch {
      setLayouts((prev) => prev.filter((l) => l.id !== id));
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>레이아웃 관리</h1>
          <p style={s.subtitle}>전문 메타데이터 필드 관리</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.addTelegramBtn} onClick={() => setShowAddTelegram(!showAddTelegram)}>+ 전문 추가</button>
          <button style={s.addBtn} onClick={() => setShowAddField(!showAddField)} disabled={!selectedTelegram}>+ 필드 추가</button>
        </div>
      </div>

      {/* 새 전문 추가 폼 */}
      {showAddTelegram && (
        <div style={s.addForm}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#36a2eb" }}>📋 새 전문 등록</div>
          <div style={s.addFormGrid}>
            <div>
              <label style={s.formLabel}>전문코드 *</label>
              <input
                style={s.formInput}
                placeholder="예: TR0002"
                value={newTelegram.telegramId}
                onChange={(e) => setNewTelegram({ ...newTelegram, telegramId: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label style={s.formLabel}>전문명 *</label>
              <input
                style={s.formInput}
                placeholder="예: 계좌조회"
                value={newTelegram.telegramName}
                onChange={(e) => setNewTelegram({ ...newTelegram, telegramName: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <button style={s.addConfirmBtn} onClick={handleAddTelegram} disabled={loading}>등록</button>
              <button style={s.cancelBtn} onClick={() => setShowAddTelegram(false)}>취소</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#5c5f73", marginTop: 8 }}>※ 기본 필드(MSG_LEN)가 자동 생성됩니다. 이후 필드를 추가해주세요.</div>
        </div>
      )}

      {/* Telegram selector */}
      <div style={s.selectorRow}>
        {telegrams.map((t) => (
          <button key={t} onClick={() => setSelectedTelegram(t)} style={{ ...s.telegramTab, ...(selectedTelegram === t ? s.telegramTabActive : {}) }}>
            {t}
            <span style={s.telegramCount}>{layouts.filter((l) => l.telegramId === t).length}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.stat}><span style={s.statLabel}>전체길이</span><span style={{ ...s.statValue, color: "#36a2eb" }}>{totalLength}B</span></div>
        <div style={s.stat}><span style={s.statLabel}>헤더</span><span style={{ ...s.statValue, color: "#00bfb3" }}>{headerLen}B</span></div>
        <div style={s.stat}><span style={s.statLabel}>바디</span><span style={{ ...s.statValue, color: "#f5a623" }}>{bodyLen}B</span></div>
        <div style={s.stat}><span style={s.statLabel}>필드 수</span><span style={s.statValue}>{filtered.length}</span></div>
      </div>

      {/* 필드 추가 폼 */}
      {showAddField && (
        <div style={s.addForm}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#00bfb3" }}>➕ 필드 추가 — {selectedTelegram}</div>
          <div style={s.addFormGrid}>
            <div>
              <label style={s.formLabel}>필드명 *</label>
              <input style={s.formInput} placeholder="ACCT_NO" value={newField.fieldName} onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })} />
            </div>
            <div>
              <label style={s.formLabel}>한글명</label>
              <input style={s.formInput} placeholder="계좌번호" value={newField.fieldNameKr} onChange={(e) => setNewField({ ...newField, fieldNameKr: e.target.value })} />
            </div>
            <div>
              <label style={s.formLabel}>길이 *</label>
              <input style={{ ...s.formInput, width: 80 }} type="number" placeholder="16" value={newField.fieldLength || ""} onChange={(e) => setNewField({ ...newField, fieldLength: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={s.formLabel}>타입</label>
              <select style={s.formSelect} value={newField.dataType} onChange={(e) => setNewField({ ...newField, dataType: e.target.value })}>
                <option>STRING</option><option>NUMBER</option><option>DATE</option><option>FILLER</option>
              </select>
            </div>
            <div>
              <label style={s.formLabel}>섹션</label>
              <select style={s.formSelect} value={newField.section} onChange={(e) => setNewField({ ...newField, section: e.target.value })}>
                <option>HEADER</option><option>BODY</option>
              </select>
            </div>
            <div>
              <label style={s.formLabel}>정렬</label>
              <select style={s.formSelect} value={newField.align} onChange={(e) => setNewField({ ...newField, align: e.target.value })}>
                <option>LEFT</option><option>RIGHT</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <button style={s.addConfirmBtn} onClick={handleAddField} disabled={loading}>추가</button>
              <button style={s.cancelBtn} onClick={() => setShowAddField(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Field Table */}
      <div style={s.table}>
        <div style={s.tableHead}>
          <span style={{ width: 40 }}>#</span>
          <span style={{ width: 50 }}>섹션</span>
          <span style={{ flex: 1 }}>필드명</span>
          <span style={{ flex: 1 }}>한글명</span>
          <span style={{ width: 60 }}>길이</span>
          <span style={{ width: 70 }}>타입</span>
          <span style={{ width: 50 }}>정렬</span>
          <span style={{ width: 50 }}>패딩</span>
          <span style={{ width: 50 }}>필수</span>
          <span style={{ width: 80 }}>액션</span>
        </div>
        {filtered.sort((a, b) => a.fieldSeq - b.fieldSeq).map((f) => (
          <div key={f.id} style={s.tableRow}>
            <span style={{ width: 40, color: "#5c5f73" }}>{f.fieldSeq}</span>
            <span style={{ width: 50 }}>
              <span style={{ ...s.sectionBadge, background: f.section === "HEADER" ? "#36a2eb18" : "#f5a62318", color: f.section === "HEADER" ? "#36a2eb" : "#f5a623" }}>
                {f.section === "HEADER" ? "H" : "B"}
              </span>
            </span>
            <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{f.fieldName}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{f.fieldNameKr}{f.required && <span style={{ color: "#ff6b6b", marginLeft: 3 }}>*</span>}</span>
            <span style={{ width: 60, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#36a2eb" }}>{f.fieldLength}</span>
            <span style={{ width: 70 }}>
              <span style={{ ...s.typeBadge, background: f.dataType === "NUMBER" ? "#9170f218" : f.dataType === "DATE" ? "#00bfb318" : "#23244018", color: f.dataType === "NUMBER" ? "#9170f2" : f.dataType === "DATE" ? "#00bfb3" : "#9ea2b0" }}>
                {f.dataType}
              </span>
            </span>
            <span style={{ width: 50, fontSize: 11, color: "#5c5f73" }}>{f.align}</span>
            <span style={{ width: 50, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#5c5f73" }}>{f.padChar === " " ? "SP" : f.padChar}</span>
            <span style={{ width: 50, fontSize: 11 }}>{f.required ? "✓" : ""}</span>
            <span style={{ width: 80, display: "flex", gap: 6 }}>
              <button style={{ ...s.actionBtn, color: "#ff6b6b" }} onClick={() => handleDelete(f.id)}>✕</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#5c5f73", fontSize: 13 }}>
            필드가 없습니다. 필드 추가 버튼을 눌러 추가해주세요.
          </div>
        )}
      </div>
    </div>
  );
}

function getSampleLayouts() {
  return [
    { id: 1, telegramId: "TR0001", telegramName: "계좌이체", fieldSeq: 1, fieldName: "MSG_LEN", fieldNameKr: "전문길이", fieldLength: 4, dataType: "NUMBER", align: "RIGHT", padChar: "0", section: "HEADER", required: true, active: true },
    { id: 2, telegramId: "TR0001", telegramName: "계좌이체", fieldSeq: 2, fieldName: "MSG_TYPE", fieldNameKr: "전문구분", fieldLength: 4, dataType: "STRING", align: "LEFT", padChar: " ", section: "HEADER", required: true, active: true },
    { id: 3, telegramId: "TR0001", telegramName: "계좌이체", fieldSeq: 3, fieldName: "TRAN_CD", fieldNameKr: "거래코드", fieldLength: 6, dataType: "STRING", align: "LEFT", padChar: " ", section: "HEADER", required: true, active: true },
    { id: 9, telegramId: "INQ001", telegramName: "잔액조회", fieldSeq: 1, fieldName: "MSG_LEN", fieldNameKr: "전문길이", fieldLength: 4, dataType: "NUMBER", align: "RIGHT", padChar: "0", section: "HEADER", required: true, active: true },
    { id: 10, telegramId: "INQ001", telegramName: "잔액조회", fieldSeq: 2, fieldName: "ACCT_NO", fieldNameKr: "계좌번호", fieldLength: 16, dataType: "STRING", align: "LEFT", padChar: " ", section: "BODY", required: true, active: true },
    { id: 11, telegramId: "INQ001", telegramName: "잔액조회", fieldSeq: 3, fieldName: "BALANCE", fieldNameKr: "잔액", fieldLength: 15, dataType: "NUMBER", align: "RIGHT", padChar: "0", section: "BODY", required: false, active: true },
  ];
}

const s = {
  page: { padding: "24px 28px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: "#e8eaed" },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  addBtn: { padding: "8px 16px", background: "linear-gradient(135deg, #36a2eb, #00bfb3)", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  addTelegramBtn: { padding: "8px 16px", background: "linear-gradient(135deg, #f5a623, #ff6b6b)", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" },

  selectorRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  telegramTab: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#232440", border: "1px solid #2d2e4a", borderRadius: 6, color: "#9ea2b0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" },
  telegramTabActive: { background: "#36a2eb15", borderColor: "#36a2eb", color: "#36a2eb" },
  telegramCount: { fontSize: 10, padding: "1px 5px", background: "#1a1b2e", borderRadius: 8, color: "#5c5f73" },

  statsRow: { display: "flex", gap: 16, marginBottom: 16 },
  stat: { display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#232440", borderRadius: 6 },
  statLabel: { fontSize: 11, color: "#5c5f73" },
  statValue: { fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#e8eaed" },

  addForm: { background: "#232440", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid #2d2e4a" },
  addFormGrid: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  formLabel: { display: "block", fontSize: 10, color: "#5c5f73", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" },
  formInput: { padding: "7px 10px", background: "#1a1b2e", border: "1px solid #2d2e4a", borderRadius: 4, color: "#e8eaed", fontSize: 12, outline: "none", width: 130, fontFamily: "'JetBrains Mono', monospace" },
  formSelect: { padding: "7px 8px", background: "#1a1b2e", border: "1px solid #2d2e4a", borderRadius: 4, color: "#e8eaed", fontSize: 12, outline: "none" },
  addConfirmBtn: { padding: "7px 16px", background: "#36a2eb", border: "none", borderRadius: 4, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  cancelBtn: { padding: "7px 12px", background: "transparent", border: "1px solid #2d2e4a", borderRadius: 4, color: "#9ea2b0", fontSize: 12, cursor: "pointer" },

  table: { background: "#232440", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  tableHead: { display: "flex", alignItems: "center", padding: "10px 16px", background: "#1d1e33", borderBottom: "1px solid #2d2e4a", fontSize: 10, fontWeight: 600, color: "#5c5f73", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #2d2e4a22", fontSize: 13, color: "#e8eaed" },
  sectionBadge: { fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.5 },
  typeBadge: { fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3 },
  actionBtn: { background: "transparent", border: "1px solid #2d2e4a", borderRadius: 4, color: "#9ea2b0", fontSize: 12, cursor: "pointer", padding: "3px 8px" },
};
