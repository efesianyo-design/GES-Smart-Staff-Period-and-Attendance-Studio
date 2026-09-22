import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/authContext';
import { OFFICIAL_GES_SCHOOLS } from '../../utils/security';
import { Shield, LogOut, ArrowLeft, Building2 } from 'lucide-react';

/**
 * (super) Layout
 * Features the GES Super Admin Header + School Switcher for Regional and National Directors.
 */
export default function SuperLayout() {
  const { user, logout, config, switchSuperAdminSchool } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/super/login');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col">
      <Outlet />
    </div>
  );
}
