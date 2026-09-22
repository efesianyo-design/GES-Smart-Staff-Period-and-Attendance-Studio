// login_separation_test.js
import { test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SchoolLoginPage from '../src/app/school/login/page';
import SuperAdminLoginPage from '../src/app/super/login/page';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/utils/authContext';

test('School Admin Login page is dedicated and has no Super Admin tab', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/school/login']}>
        <SchoolLoginPage />
      </MemoryRouter>
    </AuthProvider>
  );

  // Dedicated School Admin Header
  expect(screen.getByText('School Admin Console Login')).toBeInTheDocument();
  expect(screen.getByText('Protected School Console')).toBeInTheDocument();
  expect(screen.getByText('Select School Campus')).toBeInTheDocument();
  expect(screen.getByText('School Admin PIN')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Authorize School Console Entry/i })).toBeInTheDocument();

  // Verify the tabs are REMOVED - there is no tab switcher button for Super Admin inside this form
  expect(screen.queryByRole('button', { name: /🏛️ Super Admin/i })).not.toBeInTheDocument();

  // Verify there is a clear cross-link for Directorate officers
  expect(screen.getByText(/GES National Directorate Officer\?/i)).toBeInTheDocument();
  expect(screen.getByText(/Go to Super Admin Login/i)).toBeInTheDocument();
});

test('Super Admin Directorate Login page is dedicated and separated', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/super/login']}>
        <SuperAdminLoginPage />
      </MemoryRouter>
    </AuthProvider>
  );

  // Dedicated Super Admin Directorate Header
  expect(screen.getByText('Super Admin Directorate Login')).toBeInTheDocument();
  expect(screen.getByText('GES Headquarters Directorate')).toBeInTheDocument();
  expect(screen.getByText('Super Admin Master PIN')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Authorize Directorate Entry/i })).toBeInTheDocument();

  // Verify no school selection dropdown on Super Admin login
  expect(screen.queryByText('Select School Campus')).not.toBeInTheDocument();

  // Verify there is a clear link back to School Admin Login
  expect(screen.getByText(/School Administrator\?/i)).toBeInTheDocument();
  expect(screen.getByText(/Go to School Admin Login/i)).toBeInTheDocument();
});
