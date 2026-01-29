import { createRoot } from 'react-dom/client';
import App from './App';
import ConfigProvider from './contexts/ConfigContext';

// [추가] 전역 CSS 불러오기
import 'assets/css/common.css'; 

// 폰트나 기타 라이브러리 CSS가 있다면 여기 유지
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <ConfigProvider>
    <App />
  </ConfigProvider>
);