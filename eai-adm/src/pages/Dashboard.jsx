import { useState, useEffect, useRef, useCallback } from "react";
import { connectMonitorStream, getStats, getRecentLogs, resetStats } from "../api/monitoringApi";

export default function Dashboard() {
  // ── SSE 연결 상태 ──
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // ── 통계 ──
  const [stats, setStats] = useState({
    totalRequests: 0, successCount: 0, errorCount: 0,
    successRate: 0, avgResponseTimeMs: 0, currentTps: 0,
    tpsHistory: [], responseTimeDistribution: {},
    telegramDistribution: {}, protocolDistribution: {},
    recentResponseTimes: [], activeConnections: 0,
  });

  // ── 실시간 로그 피드 ──
  const [logs, setLogs] = useState([]);

  // ── TPS 차트 데이터 (최근 60초) ──
  const [tpsData, setTpsData] = useState(Array(60).fill(0));

  // ── 응답시간 추이 (최근 50건) ──
  const [rtTrend, setRtTrend] = useState([]);

  // ── SSE 연결 ──
  useEffect(() => {
    const onInit = (data) => {
      setStats(data);
      setConnected(true);
      if (data.tpsHistory) {
        setTpsData(data.tpsHistory.map(h => h.count));
      }
    };

    const onLog = (logEvent) => {
      setLogs(prev => [logEvent, ...prev].slice(0, 50));
      setRtTrend(prev => [logEvent.processTimeMs || 0, ...prev].slice(0, 50));
    };

    const onStats = (data) => {
      setStats(data);
      if (data.tpsHistory) {
        setTpsData(data.tpsHistory.map(h => h.count));
      }
    };

    // SSE 연결
    const es = connectMonitorStream(onLog, onStats, onInit);
    eventSourceRef.current = es;

    // fallback: SSE 연결 전 초기 데이터 로드
    getStats().then(res => {
      if (res.data) setStats(res.data);
    }).catch(() => {});

    getRecentLogs().then(res => {
      if (res.data) setLogs(res.data.slice(0, 50));
    }).catch(() => {});

    return () => {
      if (es) es.close();
      setConnected(false);
    };
  }, []);

  // ── 통계 리셋 ──
  const handleReset = async () => {
    await resetStats();
    setLogs([]);
    setTpsData(Array(60).fill(0));
    setRtTrend([]);
  };

  // ── 파생 데이터 ──
  const { totalRequests, successCount, errorCount, successRate, avgResponseTimeMs, currentTps } = stats;
  const rtDist = stats.responseTimeDistribution || {};
  const telegramDist = stats.telegramDistribution || {};
  const protoDist = stats.protocolDistribution || {};

  const maxTps = Math.max(...tpsData, 1);
  const maxRt = Math.max(...(stats.recentResponseTimes || [0]), 1);

  // ── 전문코드 분포 (상위 5개) ──
  const telegramEntries = Object.entries(telegramDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const telegramTotal = Object.values(telegramDist).reduce((s, v) => s + v, 0) || 1;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Real-time Monitor</h1>
          <p style={s.subtitle}>Simulator 전문 수신 실시간 모니터링</p>
        </div>
        <div style={s.headerRight}>
          <div style={{ ...s.connBadge, background: connected ? "#00bfb315" : "#ff6b6b15", color: connected ? "#00bfb3" : "#ff6b6b" }}>
            <span style={{ ...s.connDot, background: connected ? "#00bfb3" : "#ff6b6b" }} />
            {connected ? "SSE CONNECTED" : "DISCONNECTED"}
          </div>
          <button onClick={handleReset} style={s.resetBtn}>↻ Reset</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={s.kpiGrid}>
        <KpiCard label="Total Requests" value={totalRequests} icon="↗" color="#36a2eb" />
        <KpiCard label="Success Rate" value={`${successRate}%`} icon="✓" color="#00bfb3" />
        <KpiCard label="Current TPS" value={currentTps} icon="⚡" color="#f5a623" />
        <KpiCard label="Avg Response" value={`${avgResponseTimeMs}ms`} icon="◷" color="#a78bfa" />
        <KpiCard label="Errors" value={errorCount} icon="✕" color="#ff6b6b" />
        <KpiCard label="SSE Clients" value={stats.activeConnections} icon="📡" color="#6366f1" />
      </div>

      {/* ── Charts Row 1: TPS + 응답시간 추이 ── */}
      <div style={s.chartsRow}>
        {/* TPS 실시간 차트 (60초) */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Live TPS</span>
            <span style={s.chartPeriod}>Last 60 seconds</span>
          </div>
          <div style={s.barChart}>
            {tpsData.map((v, i) => (
              <div key={i} style={s.barGroup}>
                <div style={s.barContainer}>
                  <div style={{
                    ...s.bar,
                    height: `${(v / maxTps) * 100}%`,
                    background: v > 0
                      ? `linear-gradient(to top, #36a2eb, #36a2eb${v > maxTps * 0.8 ? "ff" : "88"})`
                      : "#36a2eb22",
                    minHeight: v > 0 ? 3 : 1,
                  }} />
                </div>
                {i % 10 === 0 && <span style={s.barLabel}>{60 - i}s</span>}
              </div>
            ))}
          </div>
          <div style={s.chartFooter}>
            <span>Peak: {maxTps} req/s</span>
            <span>Current: {currentTps} req/s</span>
          </div>
        </div>

        {/* 응답시간 추이 (최근 50건) */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Response Time Trend</span>
            <span style={s.chartPeriod}>Last {rtTrend.length} requests</span>
          </div>
          <div style={s.lineChart}>
            <svg viewBox={`0 0 ${Math.max(rtTrend.length, 1) * 8} 120`} style={{ width: "100%", height: 140 }} preserveAspectRatio="none">
              {rtTrend.length > 1 && (
                <>
                  {/* 영역 채우기 */}
                  <path
                    d={`M0,${120 - (rtTrend[rtTrend.length - 1] / maxRt) * 100} ` +
                      rtTrend.map((v, i) => `L${(rtTrend.length - 1 - i) * 8},${120 - (v / maxRt) * 100}`).join(" ") +
                      ` L${(rtTrend.length - 1) * 8},120 L0,120 Z`}
                    fill="url(#rtGradient)" opacity="0.3"
                  />
                  {/* 라인 */}
                  <polyline
                    points={rtTrend.map((v, i) => `${(rtTrend.length - 1 - i) * 8},${120 - (v / maxRt) * 100}`).join(" ")}
                    fill="none" stroke="#a78bfa" strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="rtGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </>
              )}
              {rtTrend.length === 0 && (
                <text x="50%" y="60" textAnchor="middle" fill="#5c5f73" fontSize="12">
                  Waiting for data...
                </text>
              )}
            </svg>
          </div>
          <div style={s.chartFooter}>
            <span>Avg: {avgResponseTimeMs}ms</span>
            <span>Latest: {rtTrend[0] || 0}ms</span>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: 응답시간 분포 + 전문코드 분포 + 로그 피드 ── */}
      <div style={s.bottomRow}>
        {/* 응답시간 분포 */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Response Time Distribution</span>
          </div>
          <div style={s.heatmapGrid}>
            {[
              { range: "0-50ms", key: "0-50ms", color: "#00bfb3" },
              { range: "50-100ms", key: "50-100ms", color: "#36a2eb" },
              { range: "100-200ms", key: "100-200ms", color: "#f5a623" },
              { range: "200-500ms", key: "200-500ms", color: "#ee78a0" },
              { range: "500ms+", key: "500ms+", color: "#ff6b6b" },
            ].map(({ range, key, color }) => {
              const count = rtDist[key] || 0;
              const pct = totalRequests > 0 ? (count / totalRequests) * 100 : 0;
              return (
                <div key={range} style={s.heatRow}>
                  <span style={s.heatLabel}>{range}</span>
                  <div style={s.heatBarBg}>
                    <div style={{ ...s.heatBarFill, width: `${pct}%`, background: color }} />
                  </div>
                  <span style={s.heatValue}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* 전문코드 분포 */}
          <div style={{ ...s.chartHeader, marginTop: 24 }}>
            <span style={s.chartTitle}>Telegram Distribution</span>
          </div>
          <div style={s.heatmapGrid}>
            {telegramEntries.map(([id, count], i) => {
              const colors = ["#36a2eb", "#00bfb3", "#f5a623", "#a78bfa", "#ee78a0"];
              const pct = (count / telegramTotal) * 100;
              return (
                <div key={id} style={s.heatRow}>
                  <span style={{ ...s.heatLabel, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{id}</span>
                  <div style={s.heatBarBg}>
                    <div style={{ ...s.heatBarFill, width: `${pct}%`, background: colors[i % colors.length] }} />
                  </div>
                  <span style={s.heatValue}>{count}</span>
                </div>
              );
            })}
            {telegramEntries.length === 0 && (
              <div style={{ color: "#5c5f73", fontSize: 12, padding: "8px 0" }}>No data yet</div>
            )}
          </div>
        </div>

        {/* 실시간 로그 피드 */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.chartTitle}>Live Activity Feed</span>
            <span style={s.chartPeriod}>{logs.length} events</span>
          </div>
          <div style={s.activityList}>
            {logs.length === 0 && (
              <div style={{ color: "#5c5f73", fontSize: 13, padding: 20, textAlign: "center" }}>
                Simulator 리스너를 시작하고 전문을 보내면<br />실시간으로 표시됩니다
              </div>
            )}
            {logs.slice(0, 15).map((d, i) => (
              <div key={`${d.receivedAt}-${i}`} style={{ ...s.activityItem, animation: i === 0 ? "slideIn 0.3s ease" : "none" }}>
                <span style={{
                  ...s.statusDot,
                  background: d.status === "SUCCESS" ? "#00bfb3" : "#ff6b6b",
                  boxShadow: d.status === "SUCCESS" ? "0 0 6px #00bfb3" : "0 0 6px #ff6b6b",
                }} />
                <span style={s.activityTelegram}>{d.telegramId || "—"}</span>
                <span style={{
                  ...s.statusBadge,
                  background: d.status === "SUCCESS" ? "#00bfb318" : "#ff6b6b18",
                  color: d.status === "SUCCESS" ? "#00bfb3" : "#ff6b6b",
                }}>
                  {d.status}
                </span>
                <span style={s.activityMs}>{d.processTimeMs || 0}ms</span>
                <span style={s.activityClient}>{d.clientIp}</span>
                <span style={s.activityTime}>
                  {d.receivedAt ? new Date(d.receivedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${color}` }}>
      <div style={s.kpiTop}>
        <span style={s.kpiLabel}>{label}</span>
        <span style={{ ...s.kpiIcon, color, background: `${color}15` }}>{icon}</span>
      </div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
    </div>
  );
}

const s = {
  page: { padding: "24px 28px", animation: "fadeIn 0.3s ease", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: "#e8eaed", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: "#5c5f73", marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  connBadge: { display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  connDot: { width: 7, height: 7, borderRadius: "50%", animation: "pulse 2s infinite" },
  resetBtn: { padding: "6px 14px", borderRadius: 6, border: "1px solid #2d2e4a", background: "transparent", color: "#9ea2b0", fontSize: 12, cursor: "pointer" },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 20 },
  kpiCard: { background: "#232440", borderRadius: 10, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  kpiLabel: { fontSize: 10, fontWeight: 600, color: "#9ea2b0", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiIcon: { width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 },
  kpiValue: { fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 },

  chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  chartCard: { background: "#232440", borderRadius: 10, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: 600, color: "#e8eaed" },
  chartPeriod: { fontSize: 10, color: "#5c5f73", padding: "2px 8px", background: "#1a1b2e", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" },
  chartFooter: { display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#5c5f73", fontFamily: "'JetBrains Mono', monospace" },

  barChart: { display: "flex", alignItems: "flex-end", gap: 2, height: 140, padding: "0 2px" },
  barGroup: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" },
  barContainer: { flex: 1, width: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" },
  barLabel: { fontSize: 8, color: "#5c5f73", marginTop: 3 },

  lineChart: { padding: "0 4px" },

  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 },
  heatmapGrid: { display: "flex", flexDirection: "column", gap: 8 },
  heatRow: { display: "flex", alignItems: "center", gap: 10 },
  heatLabel: { fontSize: 11, color: "#9ea2b0", width: 80, textAlign: "right" },
  heatBarBg: { flex: 1, height: 20, background: "#1a1b2e", borderRadius: 4, overflow: "hidden" },
  heatBarFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  heatValue: { fontSize: 12, fontWeight: 600, color: "#e8eaed", width: 36, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },

  activityList: { display: "flex", flexDirection: "column", maxHeight: 440, overflow: "auto" },
  activityItem: { display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #2d2e4a22" },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  activityTelegram: { fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", width: 64, color: "#e8eaed" },
  statusBadge: { fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.3 },
  activityMs: { fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#9ea2b0", width: 50, textAlign: "right" },
  activityClient: { fontSize: 11, color: "#5c5f73", width: 90, overflow: "hidden", textOverflow: "ellipsis" },
  activityTime: { fontSize: 10, color: "#5c5f73", marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace" },
};
