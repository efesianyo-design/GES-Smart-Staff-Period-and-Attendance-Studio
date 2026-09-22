import React from 'react';
import { SuperAdminDirectorateDashboard } from '../components/SuperAdminDirectorateDashboard';
import { AuthProvider } from '../utils/authContext';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <AuthProvider>
      <SuperAdminDirectorateDashboard />
    </AuthProvider>
  );
};

export default SuperAdminDashboard;
