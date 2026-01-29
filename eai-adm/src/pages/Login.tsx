import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';

const Login: React.FC = () => {
    const [userId, setUserId] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 백엔드가 죽어있어도 테스트 가능하게 처리
            const response = await axios.post('http://localhost:8080/api/user/login', { userId, password });
            if (response.status === 200) {
                localStorage.setItem('user', JSON.stringify(response.data));
                navigate('/dashboard');
            }
        } catch (error) {
            // [비상용] 백엔드 연결 안 되어도 일단 admin/1234면 통과 (개발 편의상)
            if(userId === 'admin' && password === '1234') {
                alert('개발 모드: 관리자 로그인 성공');
                navigate('/dashboard');
            } else {
                alert('로그인 실패');
            }
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>Login</Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
                    <TextField label="ID" fullWidth margin="normal" value={userId} onChange={(e) => setUserId(e.target.value)} autoFocus />
                    <TextField label="PW" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>로그인</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;