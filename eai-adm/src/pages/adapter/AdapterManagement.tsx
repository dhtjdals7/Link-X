import React, { useState } from 'react';
import { 
    Box, Paper, Typography, Button, TextField, InputAdornment, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, IconButton, Stack, Collapse, Alert, Snackbar
} from '@mui/material';
import { 
    Search as SearchIcon, 
    Refresh as RefreshIcon,
    Add as AddIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Cable as CableIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Folder as GroupIcon
} from '@mui/icons-material';

// ----------------------------------------------------------------------
// 1. 데이터 타입 정의 (한 파일에 합침)
// ----------------------------------------------------------------------
interface Adapter {
    id: string;
    name: string;
    type: 'Server' | 'Client';
    protocol: 'TCP/IP' | 'HTTP' | 'ISO-8583' | 'RFC';
    ip: string;
    port: number;
    status: 'Running' | 'Stopped' | 'Error';
}

interface AdapterGroup {
    groupId: string;
    groupName: string;
    description: string;
    items: Adapter[];
}

// ----------------------------------------------------------------------
// 2. 샘플 데이터
// ----------------------------------------------------------------------
const initialGroups: AdapterGroup[] = [
    {
        groupId: 'GRP-CORE',
        groupName: '계정계 (Core Banking)',
        description: '수신/여신 및 공통 업무 처리용 어댑터 그룹',
        items: [
            { id: 'ADPT-CORE-01', name: '수신 조회용 (TCP)', type: 'Server', protocol: 'TCP/IP', ip: '10.20.1.10', port: 9001, status: 'Running' },
            { id: 'ADPT-CORE-02', name: '여신 실행용 (TCP)', type: 'Server', protocol: 'TCP/IP', ip: '10.20.1.11', port: 9002, status: 'Running' },
            { id: 'ADPT-CORE-03', name: '대량 이체 배치', type: 'Client', protocol: 'TCP/IP', ip: '10.20.1.12', port: 9003, status: 'Stopped' },
        ]
    },
    {
        groupId: 'GRP-EXT',
        groupName: '대외계 (External FEP)',
        description: '오픈뱅킹, 금융결제원, 신용정보원 연계',
        items: [
            { id: 'ADPT-EXT-01', name: '오픈뱅킹 송신 (HTTP)', type: 'Client', protocol: 'HTTP', ip: '192.168.10.5', port: 8080, status: 'Running' },
            { id: 'ADPT-EXT-02', name: '금융결제원 전문 송수신', type: 'Client', protocol: 'ISO-8583', ip: '192.168.10.6', port: 7000, status: 'Error' },
        ]
    },
    {
        groupId: 'GRP-CARD',
        groupName: '카드계 (Card System)',
        description: '카드 승인 및 결제 내역 연동',
        items: [
            { id: 'ADPT-CARD-01', name: '카드 승인 요청', type: 'Client', protocol: 'TCP/IP', ip: '172.16.50.1', port: 4000, status: 'Running' },
            { id: 'ADPT-CARD-02', name: '포인트 조회', type: 'Client', protocol: 'HTTP', ip: '172.16.50.2', port: 80, status: 'Stopped' },
        ]
    }
];

// ----------------------------------------------------------------------
// 3. 하위 컴포넌트 (테이블 행 - Row)
// ----------------------------------------------------------------------
const Row = ({ group, onToggleAdapter }: { group: AdapterGroup, onToggleAdapter: (id: string) => void }) => {
    const [open, setOpen] = useState(true); // 기본값: 펼침

    // 상태 카운트 계산
    const total = group.items.length;
    const running = group.items.filter(i => i.status === 'Running').length;
    const error = group.items.filter(i => i.status === 'Error').length;

    return (
        <React.Fragment>
            {/* 상위 그룹 행 */}
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: '#f8f9fa' }}>
                <TableCell width={50}>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <GroupIcon color="primary" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">{group.groupName}</Typography>
                            <Typography variant="caption" color="text.secondary">{group.groupId}</Typography>
                        </Box>
                    </Stack>
                </TableCell>
                <TableCell colSpan={2} sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {group.description}
                </TableCell>
                <TableCell align="right" colSpan={3}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Chip label={`Total: ${total}`} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
                        <Chip label={`Run: ${running}`} size="small" sx={{ bgcolor: '#e6fffa', color: '#00bfb3', fontWeight: 'bold' }} />
                        {error > 0 && <Chip label={`Error: ${error}`} size="small" sx={{ bgcolor: '#ffebeb', color: '#bd271e', fontWeight: 'bold' }} />}
                    </Stack>
                </TableCell>
            </TableRow>
            
            {/* 하위 상세 목록 (펼쳐지는 부분) */}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, ml: 6 }}>
                            <Table size="small" aria-label="adapter-details">
                                <TableHead sx={{ bgcolor: '#fff' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#999', fontSize: '0.8rem' }}>ID</TableCell>
                                        <TableCell sx={{ color: '#999', fontSize: '0.8rem' }}>어댑터명</TableCell>
                                        <TableCell sx={{ color: '#999', fontSize: '0.8rem' }}>프로토콜</TableCell>
                                        <TableCell sx={{ color: '#999', fontSize: '0.8rem' }}>IP:Port</TableCell>
                                        <TableCell sx={{ color: '#999', fontSize: '0.8rem' }}>상태</TableCell>
                                        <TableCell align="right" sx={{ color: '#999', fontSize: '0.8rem' }}>제어</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {group.items.map((adapter) => (
                                        <TableRow key={adapter.id} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85rem' }}>{adapter.id}</TableCell>
                                            <TableCell>{adapter.name}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <Chip label={adapter.protocol} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', borderRadius: 1 }} />
                                                    <Chip label={adapter.type} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f0f0f0', borderRadius: 1 }} />
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{adapter.ip}:{adapter.port}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={adapter.status} 
                                                    size="small" 
                                                    sx={{ 
                                                        height: 20, fontSize: '0.7rem', fontWeight: 'bold', borderRadius: 1,
                                                        bgcolor: adapter.status === 'Running' ? '#e6fffa' : adapter.status === 'Stopped' ? '#f5f7fa' : '#ffebeb',
                                                        color: adapter.status === 'Running' ? '#00bfb3' : adapter.status === 'Stopped' ? '#69707d' : '#bd271e',
                                                        border: `1px solid ${adapter.status === 'Running' ? '#00bfb3' : adapter.status === 'Stopped' ? '#d3dae6' : '#bd271e'}`
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                 <IconButton 
                                                    size="small" 
                                                    color={adapter.status === 'Running' ? 'error' : 'primary'}
                                                    onClick={() => onToggleAdapter(adapter.id)}
                                                    title={adapter.status === 'Running' ? "중지" : "기동"}
                                                    sx={{ border: '1px solid #eee' }}
                                                >
                                                    {adapter.status === 'Running' ? <StopIcon fontSize="small" /> : <StartIcon fontSize="small" />}
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

// ----------------------------------------------------------------------
// 4. 메인 화면 컴포넌트
// ----------------------------------------------------------------------
const AdapterManagement: React.FC = () => {
    const [groups, setGroups] = useState(initialGroups);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState<{ open: boolean, message: string, severity: 'success' | 'info' | 'error' }>({ open: false, message: '', severity: 'info' });

    // 상태 변경 로직
    const handleToggleAdapter = (targetId: string) => {
        let changedStatus = '';
        const newGroups = groups.map(group => ({
            ...group,
            items: group.items.map(item => {
                if (item.id === targetId) {
                    const newStatus = item.status === 'Running' ? 'Stopped' : 'Running';
                    changedStatus = newStatus;
                    return { ...item, status: newStatus as Adapter['status'] };
                }
                return item;
            })
        }));

        setGroups(newGroups);

        if (changedStatus) {
            setAlert({
                open: true,
                message: `어댑터 [${targetId}] 상태가 '${changedStatus}'(으)로 변경되었습니다.`,
                severity: changedStatus === 'Running' ? 'success' : 'info'
            });
        }
    };

    // 검색 필터링
    const filteredGroups = groups.filter(group => {
        const groupMatch = group.groupName.includes(searchTerm) || group.groupId.includes(searchTerm);
        const itemMatch = group.items.some(item => item.name.includes(searchTerm) || item.id.includes(searchTerm));
        return groupMatch || itemMatch;
    });

    return (
        <Box sx={{ pb: 5 }}>
            {/* 타이틀 영역 */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CableIcon color="primary" /> 어댑터 그룹 관리
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        업무 단위(그룹)별로 어댑터를 모니터링하고 제어합니다.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#0077cc' }}>
                    신규 그룹 등록
                </Button>
            </Stack>

            {/* 검색바 영역 */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #d3dae6', borderRadius: 0 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField 
                        placeholder="그룹명, 어댑터ID, IP 등으로 검색..." 
                        size="small" 
                        fullWidth 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                            sx: { bgcolor: '#f5f7fa' }
                        }}
                    />
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => setAlert({ open: true, message: '상태 정보를 갱신했습니다.', severity: 'success' })}>
                        새로고침
                    </Button>
                </Stack>
            </Paper>

            {/* 테이블 영역 */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #d3dae6', borderRadius: 0 }}>
                <Table aria-label="adapter table">
                    <TableHead sx={{ bgcolor: '#fbfcfd' }}>
                        <TableRow>
                            <TableCell />
                            <TableCell>그룹명 (Group ID)</TableCell>
                            <TableCell colSpan={2}>설명</TableCell>
                            <TableCell align="right" colSpan={3}>상태 요약</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredGroups.map((group) => (
                            <Row key={group.groupId} group={group} onToggleAdapter={handleToggleAdapter} />
                        ))}
                         {filteredGroups.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 알림바 (Toast) */}
            <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ ...alert, open: false })}>
                <Alert severity={alert.severity} variant="filled" sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdapterManagement;