import React from 'react';
import { AdminCampusDashboard } from '../../../components/AdminCampusDashboard';
import { useAuth } from '../../../utils/authContext';
import { useNavigate } from 'react-router-dom';

export default function SchoolAdminPage() {
  const { config, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/school/login');
  };

  return (
    <div className="w-full h-full">
      <AdminCampusDashboard
        isSuperAdmin={false}
        currentSchoolConfig={config}
        onLogout={handleLogout}
      />
    </div>
  );
}
