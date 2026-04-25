import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PunchDashboardPage from './page';

// ---- Mocks ---------------------------------------------------------------

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    hasPermission: (p: string) => p === 'hr.punch-approvals.access',
  }),
}));

const heatmapState: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: unknown;
  refetch: () => Promise<unknown>;
} = {
  isLoading: false,
  isError: false,
  error: null,
  data: null,
  refetch: () => Promise.resolve(undefined),
};

vi.mock('@/hooks/hr/use-punch-heatmap', () => ({
  usePunchHeatmap: () => heatmapState,
}));

// Stub the child components so we don't drag their hooks into the test tree.
vi.mock('@/components/hr/punch/PunchDashboardFeed', () => ({
  PunchDashboardFeed: () => <div data-testid="mock-punch-feed" />,
}));
vi.mock('@/components/hr/punch/PunchMissingCard', () => ({
  PunchMissingCard: () => <div data-testid="mock-punch-missing-card" />,
}));
vi.mock('@/components/hr/punch/PunchDeviceStatusCard', () => ({
  PunchDeviceStatusCard: () => <div data-testid="mock-punch-devices-card" />,
}));
vi.mock('@/components/hr/punch/PunchExportModal', () => ({
  PunchExportModal: () => null,
}));
vi.mock('@/components/hr/punch/PunchCellDetailDrawer', () => ({
  PunchCellDetailDrawer: () => null,
}));

vi.mock('@/components/ui/heatmap/employee-day-heatmap', () => ({
  EmployeeDayHeatmap: () => <div data-testid="mock-heatmap-grid" />,
}));

describe('PunchDashboardPage', () => {
  it('renders the heatmap skeleton while loading', () => {
    heatmapState.isLoading = true;
    heatmapState.isError = false;
    heatmapState.error = null;
    heatmapState.data = null;

    render(<PunchDashboardPage />);
    expect(screen.getByTestId('punch-dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('punch-heatmap-skeleton')).toBeInTheDocument();
  });

  it('renders GridError when heatmap query fails', () => {
    heatmapState.isLoading = false;
    heatmapState.isError = true;
    heatmapState.error = new Error('boom');
    heatmapState.data = null;

    render(<PunchDashboardPage />);
    expect(screen.getByTestId('punch-dashboard-page')).toBeInTheDocument();
    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });

  it('renders the heatmap when data is loaded', () => {
    heatmapState.isLoading = false;
    heatmapState.isError = false;
    heatmapState.error = null;
    heatmapState.data = {
      rows: [{ id: 'E1', label: 'João' }],
      columns: [{ id: '2026-04-01', label: '01' }],
      cells: [{ rowId: 'E1', colId: '2026-04-01', statuses: ['NORMAL'] }],
    };

    render(<PunchDashboardPage />);
    expect(screen.getByTestId('punch-dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('mock-heatmap-grid')).toBeInTheDocument();
    expect(screen.getByTestId('mock-punch-feed')).toBeInTheDocument();
    expect(screen.getByTestId('mock-punch-missing-card')).toBeInTheDocument();
    expect(screen.getByTestId('mock-punch-devices-card')).toBeInTheDocument();
  });
});
