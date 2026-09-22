import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/authContext';
import {
  Building2,
  BarChart3,
  Users,
  ShieldCheck,
  MapPin,
  LogOut,
  Sliders,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

/**
 * (school) Layout
 * Strictly scoped to the schoolCode (e.g., GES-VR-HO-002 / Mawuli Senior High School).
 * Features a desktop sidebar + admin header.
 * Cannot access or view records belonging to other institutions.
 */
export default function SchoolLayout() {
  const { user, logout, config } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/school/login');
  };

  // If on /admin, provide full-width layout so AdminCampusDashboard controls the complete 250px sidebar and light canvas
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <Outlet />
    </div>
  );
}
