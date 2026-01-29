import React from 'react';
import { 
    Paper, Typography, Box, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    TextField, InputAdornment, Button, IconButton
} from '@mui/material';
import { 
    Search as SearchIcon, 
    CalendarToday as CalendarIcon,
    Refresh as RefreshIcon,
    MoreHoriz as MoreIcon,
    FilterList as FilterIcon,
    Fullscreen as FullscreenIcon,
    ArrowDropDown as ArrowDownIcon
} from '@mui/icons-material';

const colors = {
    bg: '#f5f7fa',
    panelBorder: '#d3dae6',
    primary: '#0077cc', 
    success: '#00bfb3', 
    warning: '#f5a623',
    error: '#bd271e',
    text: '#343741'
};

const rows = [
    { id: 'TRX-20260129-001', service: '계좌이체(수취조회)', status: 'Success', time: 'Jan 29, 2026 @ 10:30:12.450', elapsed: '120ms' },
    { id: 'TRX-20260129-002', service: '대외계(FEP) 전문수신', status: 'Success', time: 'Jan 29, 2026 @ 10:30:15.112', elapsed: '80ms' },
    { id: 'TRX-20260129-003', service: '여신심사 데이터 연동', status: 'Error', time: 'Jan 29, 2026 @ 10:31:00.005', elapsed: '5200ms' },
    { id: 'TRX-20260129-004', service: '배치(Batch) 결과 전송', status: 'Success', time: 'Jan 29, 2026 @ 10:31:45.330', elapsed: '1020ms' },
    { id: 'TRX-20260129-005', service: '오픈뱅킹 잔액조회', status: 'Success', time: 'Jan 29, 2026 @ 10:32:10.880', elapsed: '150ms' },
];

const Panel = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            height: '100%', 
            border: `1px solid ${colors.panelBorder}`, 
            borderRadius: 0, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#fff'
        }}
    >
        <Box sx={{ p: 1, borderBottom: `1px solid ${colors.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff', minHeight: 40 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{title}</Typography>
            <Box>
                <IconButton size="small"><FullscreenIcon fontSize="small" /></IconButton>
                <IconButton size="small"><MoreIcon fontSize="small" /></IconButton>
            </Box>
        </Box>
        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
            {children}
        </Box>
    </Paper>
);

const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 5 }}>
            {/* 1. 상단 검색바 (Stack 사용으로 에러 원천 차단) */}
            <Paper elevation={0} sx={{ p: 1.5, mb: 3, border: `1px solid ${colors.panelBorder}`, borderRadius: 0 }}>
                {/* Grid 대신 Stack을 쓰면 xs, md 같은 거 신경 안 써도 됨 */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                    <Box sx={{ flexGrow: 1, width: '100%' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search... (e.g. status:Error AND service:MCI)"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                endAdornment: <Button size="small" sx={{ minWidth: 80, bgcolor: colors.primary, color: 'white', '&:hover': { bgcolor: '#005a9e' } }}>Search</Button>,
                                sx: { bgcolor: '#f5f7fa', fontSize: '0.9rem', fontFamily: 'monospace', height: 40 }
                            }}
                        />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                        <Button startIcon={<CalendarIcon />} endIcon={<ArrowDownIcon />} variant="outlined" size="small" sx={{ borderColor: colors.panelBorder, color: colors.text, bgcolor: '#fff', whiteSpace: 'nowrap' }}>
                            Last 15m
                        </Button>
                        <Button startIcon={<RefreshIcon />} variant="contained" size="small" sx={{ bgcolor: colors.success, color: '#fff', '&:hover': { bgcolor: '#00a399' } }}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
                
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, px: 0.5 }}>
                    <Chip icon={<FilterIcon style={{ fontSize: 16 }} />} label="status: Error" size="small" onDelete={() => {}} sx={{ bgcolor: '#ffebeb', color: colors.error, fontWeight: 'bold', borderRadius: 1 }} />
                    <Chip label="service: MCI *" size="small" onDelete={() => {}} variant="outlined" sx={{ borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ alignSelf: 'center', color: colors.primary, cursor: 'pointer', fontWeight: 'bold' }}>+ Add filter</Typography>
                </Stack>
            </Paper>

            {/* 2. 메트릭 패널 (CSS Grid 사용 - 가장 안전함) */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
                gap: 2, 
                mb: 3 
            }}>
                <Panel title="Total Transactions">
                    <Typography variant="h4" fontWeight="bold" align="center" sx={{ mt: 1 }}>12,450</Typography>
                    <Typography variant="caption" display="block" align="center" color="text.secondary">Count</Typography>
                </Panel>
                <Panel title="Success Rate">
                    <Typography variant="h4" fontWeight="bold" align="center" sx={{ mt: 1, color: colors.success }}>98.2%</Typography>
                    <Typography variant="caption" display="block" align="center" color="text.secondary">Average</Typography>
                </Panel>
                <Panel title="Error Count">
                    <Typography variant="h4" fontWeight="bold" align="center" sx={{ mt: 1, color: colors.error }}>24</Typography>
                    <Typography variant="caption" display="block" align="center" color="text.secondary">Unique Count</Typography>
                </Panel>
                <Panel title="Avg Response Time">
                    <Typography variant="h4" fontWeight="bold" align="center" sx={{ mt: 1, color: colors.warning }}>45ms</Typography>
                    <Typography variant="caption" display="block" align="center" color="text.secondary">Milliseconds</Typography>
                </Panel>
            </Box>

            {/* 3. 하단 로그 테이블 */}
            <Panel title="Live Transaction Logs [Source: mci-main-node]">
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#fbfcfd' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Transaction ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Service Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Timestamp</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Elapsed</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ fontFamily: 'monospace', color: colors.primary }}>{row.id}</TableCell>
                                    <TableCell>{row.service}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={row.status} 
                                            size="small" 
                                            sx={{ 
                                                height: 20, 
                                                fontSize: '0.75rem', 
                                                bgcolor: row.status === 'Success' ? '#e6fffa' : '#ffebeb',
                                                color: row.status === 'Success' ? colors.success : colors.error,
                                                fontWeight: 'bold'
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{row.time}</TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{row.elapsed}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Panel>
        </Box>
    );
};

export default Dashboard;