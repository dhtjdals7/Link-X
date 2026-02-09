import { useState, useEffect } from "react";

// 모의 데이터 생성
const generateMockData = () => {
  const now = Date.now();
  const protocols = ["TCP", "HTTP", "MQ"];
  const telegrams = ["TR0001", "INQ001", "TR0002", "FX0001", "INQ002"];
  const history = Array.from({ length: 50 }, (_, i) => ({
    id: 50 - i,
    telegramId: telegrams[Math.floor(Math.random() * telegrams.length)],
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    success: Math.random() > 0.12,
    elapsedMs: Math.floor(Math.random() * 800) + 20,
    createdAt: new Date(now - i * 120000).toISOString(),
  }));
  return history;
};

const generateTimeSeries = () =>
  Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    count: Math.floor(Math.random() * 180) + 20,
    errors: Math.floor(Math.random() * 12),
    avgMs: Math.floor(Math.random() * 300) + 40,
  }));

export default function Dashboard() {
  const [data] = useState(generateMockData);
  const [timeSeries] = useState(generateTimeSeries);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setLiveCount((c) => c + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const total = data.length;
  const success = data.filter((d) => d.success).length;
  const fail = total - success;
  const avgMs = Math.round(data.reduce((s, d) => s + d.elapsedMs, 0) / total);
  const successRate = ((success / total) * 100).toFixed(1);

  const protocolStats = ["TCP", "HTTP", "MQ"].map((p) => ({
    name: p,
    count: data.filter((d) => d.protocol === p).length,
    success: data.filter((d) => d.protocol === p && d.success).length,
  }));

  const maxCount = Math.max(...timeSeries.map((t) => t.count));

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.subtitle}>전문 송수신 모니터링</p>
        </div>
        <div style={s.headerRight}>
          <div style={s.liveIndicator}>
            <span style={s.liveDot} />
            <span style={{ fontSize: 12, color: "#00bfb3" }}>LIVE</span>
          </div>
          <span style={s.timestamp}>
            Last updated: {new Date().toLocaleTimeString("ko-KR")}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={s.kpiGrid}>
        <KpiCard label="Total Requests" value={total + liveCount} icon="↗" color="#36a2eb" delta="+12.3%" />
        <KpiCard label="Success Rate" value={`${successRate}%`} icon="✓" color="#00bfb3" delta="+2.1%" />
        <KpiCard label="Avg Response" value={`${avgMs}ms`} icon="◷" color="#f5a623" delta="-8.5%" />
        <KpiCard label="Errors" value={fail} icon="✕" color="#ff6b6b" delta="-3.2%" />
      </div>

      {/* Charts Row */}
      <div style={s.chartsRow}>
        {/* Time Series Bar Chart */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Requests Over Time</span>
            <span style={s.chartPeriod}>Last 24 hours</span>
          </div>
          <div style={s.barChart}>
            {timeSeries.map((t, i) => (
              <div key={i} style={s.barGroup}>
                <div style={s.barContainer}>
                  <div
                    style={{
                      ...s.bar,
                      height: `${(t.count / maxCount) * 100}%`,
                      background: t.errors > 8
                        ? "linear-gradient(to top, #ff6b6b, #ff6b6b88)"
                        : "linear-gradient(to top, #36a2eb, #36a2eb88)",
                    }}
                  />
                  {t.errors > 0 && (
                    <div
                      style={{
                        ...s.barError,
                        height: `${(t.errors / maxCount) * 100}%`,
                      }}
                    />
                  )}
                </div>
                {i % 3 === 0 && <span style={s.barLabel}>{t.hour}</span>}
              </div>
            ))}
          </div>
          <div style={s.chartLegend}>
            <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#36a2eb" }} />Success</span>
            <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#ff6b6b" }} />Error</span>
          </div>
        </div>

        {/* Protocol Distribution */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Protocol Distribution</span>
          </div>
          <div style={s.donutArea}>
            <svg viewBox="0 0 120 120" style={{ width: 160, height: 160 }}>
              {(() => {
                const colors = ["#36a2eb", "#00bfb3", "#f5a623"];
                let offset = 0;
                const totalCount = protocolStats.reduce((s, p) => s + p.count, 0);
                return protocolStats.map((p, i) => {
                  const pct = p.count / totalCount;
                  const dash = pct * 283;
                  const gap = 283 - dash;
                  const el = (
                    <circle
                      key={i}
                      cx="60" cy="60" r="45"
                      fill="none"
                      stroke={colors[i]}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      style={{ transition: "all 0.5s ease" }}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
              <text x="60" y="56" textAnchor="middle" fill="#e8eaed" fontSize="18" fontWeight="700">
                {total}
              </text>
              <text x="60" y="72" textAnchor="middle" fill="#5c5f73" fontSize="9">
                requests
              </text>
            </svg>
            <div style={s.donutLegend}>
              {protocolStats.map((p, i) => (
                <div key={p.name} style={s.donutLegendRow}>
                  <span style={{ ...s.legendDot, background: ["#36a2eb", "#00bfb3", "#f5a623"][i] }} />
                  <span style={s.donutLabel}>{p.name}</span>
                  <span style={s.donutValue}>{p.count}</span>
                  <span style={s.donutPct}>
                    {((p.count / total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Response Time Heatmap + Recent Activity */}
      <div style={s.bottomRow}>
        {/* Response Time Distribution */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Response Time Distribution</span>
          </div>
          <div style={s.heatmapGrid}>
            {["0-50ms", "50-100ms", "100-200ms", "200-500ms", "500ms+"].map((range, ri) => {
              const count = data.filter((d) => {
                if (ri === 0) return d.elapsedMs <= 50;
                if (ri === 1) return d.elapsedMs > 50 && d.elapsedMs <= 100;
                if (ri === 2) return d.elapsedMs > 100 && d.elapsedMs <= 200;
                if (ri === 3) return d.elapsedMs > 200 && d.elapsedMs <= 500;
                return d.elapsedMs > 500;
              }).length;
              const pct = (count / total) * 100;
              const colors = ["#00bfb3", "#36a2eb", "#f5a623", "#ee78a0", "#ff6b6b"];
              return (
                <div key={range} style={s.heatRow}>
                  <span style={s.heatLabel}>{range}</span>
                  <div style={s.heatBarBg}>
                    <div style={{ ...s.heatBarFill, width: `${pct}%`, background: colors[ri] }} />
                  </div>
                  <span style={s.heatValue}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Recent Activity</span>
            <span style={s.chartPeriod}>Last 10</span>
          </div>
          <div style={s.activityList}>
            {data.slice(0, 10).map((d) => (
              <div key={d.id} style={s.activityItem}>
                <span style={{
                  ...s.statusDot,
                  background: d.success ? "#00bfb3" : "#ff6b6b",
                  boxShadow: d.success ? "0 0 6px #00bfb3" : "0 0 6px #ff6b6b",
                }} />
                <span style={s.activityTelegram}>{d.telegramId}</span>
                <span style={{
                  ...s.protocolBadge,
                  background: d.protocol === "TCP" ? "#36a2eb22" : d.protocol === "HTTP" ? "#00bfb322" : "#f5a62322",
                  color: d.protocol === "TCP" ? "#36a2eb" : d.protocol === "HTTP" ? "#00bfb3" : "#f5a623",
                }}>{d.protocol}</span>
                <span style={s.activityMs}>{d.elapsedMs}ms</span>
                <span style={s.activityTime}>
                  {new Date(d.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, delta }) {
  const isPositive = delta?.startsWith("+");
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${color}` }}>
      <div style={s.kpiTop}>
        <span style={s.kpiLabel}>{label}</span>
        <span style={{ ...s.kpiIcon, color, background: `${color}15` }}>{icon}</span>
      </div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
      {delta && (
        <span style={{ ...s.kpiDelta, color: isPositive && label !== "Errors" ? "#00bfb3" : "#ff6b6b" }}>
          {delta} vs yesterday
        </span>
      )}
    </div>
  );
}

const s = {
  page: { padding: "24px 28px", animation: "fadeIn 0.3s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: "#e8eaed", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  liveIndicator: { display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#00bfb312", borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#00bfb3", animation: "pulse 2s infinite" },
  timestamp: { fontSize: 11, color: "#5c5f73" },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  kpiCard: {
    background: "#232440",
    borderRadius: 10,
    padding: "18px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  kpiLabel: { fontSize: 12, fontWeight: 500, color: "#9ea2b0", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiIcon: { width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  kpiValue: { fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 },
  kpiDelta: { fontSize: 11, marginTop: 6, display: "block" },

  chartsRow: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 },
  chartCard: { background: "#232440", borderRadius: 10, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: 600, color: "#e8eaed" },
  chartPeriod: { fontSize: 11, color: "#5c5f73", padding: "2px 8px", background: "#1a1b2e", borderRadius: 4 },

  barChart: { display: "flex", alignItems: "flex-end", gap: 3, height: 160, padding: "0 4px" },
  barGroup: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" },
  barContainer: { flex: 1, width: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: "3px 3px 0 0", minHeight: 2, transition: "height 0.5s ease" },
  barError: { position: "absolute", bottom: 0, width: "100%", background: "linear-gradient(to top, #ff6b6b, transparent)", borderRadius: "3px 3px 0 0" },
  barLabel: { fontSize: 9, color: "#5c5f73", marginTop: 4 },
  chartLegend: { display: "flex", gap: 16, marginTop: 12, justifyContent: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ea2b0" },
  legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },

  donutArea: { display: "flex", alignItems: "center", gap: 20, justifyContent: "center" },
  donutLegend: { display: "flex", flexDirection: "column", gap: 10 },
  donutLegendRow: { display: "flex", alignItems: "center", gap: 8 },
  donutLabel: { fontSize: 12, color: "#9ea2b0", width: 36 },
  donutValue: { fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#e8eaed", width: 30, textAlign: "right" },
  donutPct: { fontSize: 11, color: "#5c5f73", width: 30 },

  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  heatmapGrid: { display: "flex", flexDirection: "column", gap: 10 },
  heatRow: { display: "flex", alignItems: "center", gap: 10 },
  heatLabel: { fontSize: 11, color: "#9ea2b0", width: 70, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },
  heatBarBg: { flex: 1, height: 22, background: "#1a1b2e", borderRadius: 4, overflow: "hidden" },
  heatBarFill: { height: "100%", borderRadius: 4, transition: "width 0.6s ease" },
  heatValue: { fontSize: 12, fontWeight: 600, color: "#e8eaed", width: 30, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },

  activityList: { display: "flex", flexDirection: "column" },
  activityItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #2d2e4a22" },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  activityTelegram: { fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", width: 60 },
  protocolBadge: { fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.3 },
  activityMs: { fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#9ea2b0", marginLeft: "auto" },
  activityTime: { fontSize: 11, color: "#5c5f73", width: 50 },
};
