import { Routes, Route, Navigate } from "react-router-dom";
import CyberLayout from "./layouts/CyberLayout";
import Login from "./features/auth/Login";
import LandingPage from "./features/landing/LandingPage";
import ProfessionalReport from "./features/analysis/ProfessionalReport";
import UserManual from "./features/help/UserManual";
import { useAppSelector } from "./store/hooks";
import "./App.css";

export default function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="app-root theme-dark">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/app" element={isAuthenticated ? <CyberLayout /> : <Navigate to="/" />} />
        <Route path="/report" element={<ProfessionalReport />} />
        <Route path="/manual" element={<UserManual />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}







