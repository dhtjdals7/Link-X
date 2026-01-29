// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // 세련된 인디고 블루 (촌스러운 파랑 아님)
      light: '#e0e7ff',
      dark: '#4338ca',
      contrastText: '#fff',
    },
    secondary: {
      main: '#10b981', // 성공/완료를 뜻하는 에메랄드 그린
    },
    background: {
      default: '#f3f4f6', // 눈이 편안한 밝은 회색 배경 (흰색 아님)
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // 완전 검정보다 세련된 진한 회색
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Inter", -apple-system, sans-serif', // 폰트 우선순위
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }, // 버튼 글자 대문자 강제 해제
  },
  shape: {
    borderRadius: 12, // 전체적으로 둥글둥글하게 (8px -> 12px)
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { 
          boxShadow: 'none', 
          padding: '8px 16px',
          '&:hover': { boxShadow: 'none' } 
        }, // 버튼 그림자 제거 (요즘 트렌드: Flat Design)
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { 
          backgroundImage: 'none',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // 아주 은은한 그림자
          border: '1px solid #e5e7eb' // 얇은 테두리 추가
        }, 
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f9fafb', // 헤더 배경색 (연한 회색)
          color: '#374151',
          fontWeight: 700,
          borderBottom: '1px solid #e5e7eb',
        },
        root: {
          borderBottom: '1px solid #f3f4f6',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 }
      }
    }
  },
});

export default theme;