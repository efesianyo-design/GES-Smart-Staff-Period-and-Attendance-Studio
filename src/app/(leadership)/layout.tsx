import React from 'react';
import { RouteGuard } from '../../middleware';

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={['school_admin', 'super_admin']}>
      {children}
    </RouteGuard>
  );
}
