import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import TelegramTester from "./pages/TelegramTester";
import LayoutManager from "./pages/LayoutManager";
import HistoryPage from "./pages/HistoryPage";
import ProfileManager from "./pages/ProfileManager";
import TelegramDetail from "./pages/TelegramDetail";
import "./styles/theme.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test" element={<TelegramTester />} />
          <Route path="/layout" element={<LayoutManager />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<TelegramDetail />} />
          <Route path="/profile" element={<ProfileManager />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
