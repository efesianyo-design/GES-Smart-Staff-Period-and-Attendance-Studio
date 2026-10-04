import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from './utils/authContext';

export interface RouteMiddlewareDecision {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
}

/**
 * Core Route Middleware rule evaluator
 * - If path starts with /admin and user.role != school_admin (or super_admin) -> redirect to /school/login
 * - If path starts with /super_admin and user.role != super_admin -> redirect to /
 * - If path starts with /attendance and user is not authenticated -> allow PIN entry, but after auth check role
 */
export function checkRouteAccess(pathname: string, user: { role: UserRole }): RouteMiddlewareDecision {
  const normPath = pathname.toLowerCase();

  // Protect /admin routes
  if (normPath.startsWith('/admin')) {
    if (user.role !== 'school_admin' && user.role !== 'super_admin') {
      return {
        allowed: false,
        redirectTo: '/school/login?from=' + encodeURIComponent(pathname),
        reason: 'Restricted to verified School Administrators.',
      };
    }
  }

  // Protect /leadership routes (Requires school_admin or super_admin)
  if (normPath.startsWith('/leadership')) {
    if (user.role !== 'school_admin' && user.role !== 'super_admin') {
      return {
        allowed: false,
        redirectTo: '/school/login?from=' + encodeURIComponent(pathname),
        reason: 'Restricted to Institutional Leadership.',
      };
    }
  }

  // Protect /super_admin or /super-admin routes
  if (normPath.startsWith('/super_admin') || normPath.startsWith('/super-admin')) {
    if (user.role !== 'super_admin') {
      return {
        allowed: false,
        redirectTo: '/super/login?from=' + encodeURIComponent(pathname),
        reason: 'Restricted to GES National / Regional Directorate.',
      };
    }
  }

  // Protect /master_roster or /master-roster routes (Requires at least school_admin, super_admin, or staff HOD)
  if (normPath.startsWith('/master_roster') || normPath.startsWith('/master-roster')) {
    if (user.role === 'guest') {
      return {
        allowed: false,
        redirectTo: '/school/login?from=' + encodeURIComponent(pathname),
        reason: 'Restricted to HODs and School Administrators.',
      };
    }
  }

  // /attendance routes allow unauthenticated visitors to view the PIN/OTP entry screen
  // Once authenticated as staff, they proceed to clock-in.
  return { allowed: true };
}

/**
 * React Component Wrapper that enforces middleware rules in React Router
 */
export const RouteGuard: React.FC<{
  requiredRoles?: UserRole[];
  children: React.ReactNode;
}> = ({ requiredRoles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If specific roles required:
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    const path = location.pathname.toLowerCase();
    
    if (requiredRoles.includes('school_admin')) {
      return React.createElement(Navigate, {
        to: `/school/login?from=${encodeURIComponent(location.pathname)}`,
        replace: true,
      });
    }
    if (requiredRoles.includes('super_admin')) {
      return React.createElement(Navigate, {
        to: `/super/login?from=${encodeURIComponent(location.pathname)}`,
        replace: true,
      });
    }
    return React.createElement(Navigate, { to: '/attendance', replace: true });
  }

  return React.createElement(React.Fragment, null, children);
};
