import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material'; // 추가됨
import theme from './theme'; // 방금 만든 테마 import

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdapterManagement from './pages/adapter/AdapterManagement';
import Layout from './components/Layout';
import { Typography, Box, Paper } from '@mui/material';

// 임시 컴포넌트
const WorkInProgress = ({ title }: { title: string }) => (
  <Box>
    <Typography variant="h4" gutterBottom fontWeight="bold">{title}</Typography>
    <Paper sx={{ p: 5, textAlign: 'center', color: 'text.secondary', borderRadius: 3 }}>
      <Typography variant="h6">🚧 화면 개발 진행 중입니다.</Typography>
    </Paper>
  </Box>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}> {/* 디자인 테마 적용 */}
      <CssBaseline /> {/* 브라우저 기본 스타일 초기화 */}
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/mci" element={<Layout><WorkInProgress title="대내계(MCI) 관리" /></Layout>} />
          <Route path="/fep" element={<Layout><WorkInProgress title="대외계(FEP) 관리" /></Layout>} />
          <Route path="/etl" element={<Layout><WorkInProgress title="정보계(ETL) 관리" /></Layout>} />
          <Route path="/adapter" element={<Layout><AdapterManagement /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;