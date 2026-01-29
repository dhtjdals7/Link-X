// src/components/Layout.tsx 전체 교체
import React from 'react';
import { 
    Box, AppBar, Toolbar, Typography, Drawer, 
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
    IconButton, Avatar, Divider, Stack 
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    CompareArrows as MciIcon,
    Public as FepIcon,
    Storage as EtlIcon,
    Cable as AdapterIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    Notifications as NotiIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260; 

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: '통합 대시보드', path: '/dashboard', icon: <DashboardIcon /> },
        { text: '대내계 (MCI)', path: '/mci', icon: <MciIcon /> },
        { text: '대외계 (FEP)', path: '/fep', icon: <FepIcon /> },
        { text: '정보계 (ETL)', path: '/etl', icon: <EtlIcon /> },
        { text: '어댑터 관리', path: '/adapter', icon: <AdapterIcon /> },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            {/* 1. 상단 헤더 (흰색 배경 + 그림자 없이 테두리만) */}
            <AppBar 
                position="fixed" 
                sx={{ 
                    width: { sm: `calc(100% - ${drawerWidth}px)` }, 
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: '#fff', 
                    boxShadow: 'none',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#111827' 
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        금융 연계 시스템 (F-EAI)
                    </Typography>
                    <IconButton><NotiIcon sx={{ color: '#6b7280' }} /></IconButton>
                    <Box sx={{ ml: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 14 }}>AD</Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* 2. 좌측 사이드바 (Dark Navy 스타일) */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: 'border-box',
                        bgcolor: '#111827', // 다크 네이비 배경
                        color: '#9ca3af', // 연한 회색 텍스트
                        borderRight: 'none'
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', letterSpacing: 1 }}>
                        HANA <span style={{ color: '#6366f1' }}>SYSTEM</span>
                    </Typography>
                </Toolbar>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <List sx={{ px: 2, py: 2 }}>
                    <Typography variant="caption" sx={{ ml: 1, mb: 1, display: 'block', fontWeight: 'bold', color: '#6b7280' }}>
                        MONITORING
                    </Typography>
                    {menuItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton 
                                    onClick={() => navigate(item.path)}
                                    selected={isSelected}
                                    sx={{
                                        borderRadius: 2, // 버튼 둥글게
                                        '&.Mui-selected': {
                                            bgcolor: '#6366f1', // 선택시 인디고 색상
                                            color: '#fff',
                                            '&:hover': { bgcolor: '#4338ca' },
                                            '& .MuiListItemIcon-root': { color: '#fff' }
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            color: '#fff',
                                            '& .MuiListItemIcon-root': { color: '#fff' }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: '#9ca3af' }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
                                </ListItemButton>
                            </ListItem>
                        )
                    })}
                </List>
            </Drawer>

            {/* 3. 메인 콘텐츠 영역 (회색 배경) */}
            <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: '#f3f4f6', minHeight: '100vh', mt: 8 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;