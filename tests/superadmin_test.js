// superadmin_test.js
import { test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SuperAdminDashboard } from '../src/pages/SuperAdminDashboard';
import { MemoryRouter } from 'react-router-dom';

test('Super Admin Dashboard has all required elements', () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>
  );

  // 1. Top Bar
  const topBar = screen.getByRole('banner');
  expect(topBar).toBeInTheDocument();
  expect(within(topBar).getByText('GHANA EDUCATION SERVICE')).toBeInTheDocument();
  expect(within(topBar).getByText('Super Admin')).toBeInTheDocument();
  expect(within(topBar).getByRole('searchbox')).toBeInTheDocument();

  // 2. KPI Cards (4 cards)
  const kpiCards = screen.getAllByRole('region', { name: /card/i });
  expect(kpiCards).toHaveLength(4);

  // Check each card's title and value
  expect(within(kpiCards[0]).getByText('Total Schools')).toBeInTheDocument();
  expect(within(kpiCards[0]).getByText('3,241')).toBeInTheDocument();
  expect(within(kpiCards[1]).getByText('Student Enrollment')).toBeInTheDocument();
  expect(within(kpiCards[1]).getByText('1.12M')).toBeInTheDocument();
  expect(within(kpiCards[2]).getByText('Avg Attendance National')).toBeInTheDocument();
  expect(within(kpiCards[2]).getByText('86.4%')).toBeInTheDocument();
  expect(within(kpiCards[3]).getByText('Punctuality Rate')).toBeInTheDocument();
  expect(within(kpiCards[3]).getByText('82.1%')).toBeInTheDocument();

  // 3. Multi-School Comparison Table
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();
  expect(within(table).getByText('Prempeh College')).toBeInTheDocument();
  expect(within(table).getByText('Accra High Secondary')).toBeInTheDocument();
  expect(within(table).getByText('Mawuli School')).toBeInTheDocument();
  expect(within(table).getByText('Excellent')).toBeInTheDocument();
  expect(within(table).getByText('On Target')).toBeInTheDocument();
  expect(within(table).getByText('Good')).toBeInTheDocument();

  // 4. Regional Attendance Heatmap
  expect(screen.getByText('Regional Attendance Heatmap')).toBeInTheDocument();
  expect(screen.getByText('Greater Accra')).toBeInTheDocument();
  expect(screen.getByText('Ashanti')).toBeInTheDocument();
  expect(screen.getByText('Volta')).toBeInTheDocument();

  // 5. Security Incident Radar
  expect(screen.getByText('Security Incident Radar')).toBeInTheDocument();
  expect(screen.getByText('Theft')).toBeInTheDocument();
  expect(screen.getByText('Unauthorized Entry')).toBeInTheDocument();
  expect(screen.getByText('Vandalism')).toBeInTheDocument();

  // 6. District Alerts & System Health
  expect(screen.getByText('District Alerts')).toBeInTheDocument();
  expect(screen.getByText('System Health')).toBeInTheDocument();
  expect(screen.getByText('Last sync')).toBeInTheDocument();
  expect(screen.getByText('Uptime')).toBeInTheDocument();

  console.log('✅ Super Admin Dashboard validation passed');
});
