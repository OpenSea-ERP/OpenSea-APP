import {
  customersService,
  dealsService,
  ordersService,
} from '@/services/sales';
import type { OrderDTO } from '@/types/sales';
import { useQuery } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesDashboardData {
  // KPI row
  monthlyRevenue: number;
  monthlyOrderCount: number;
  averageTicket: number;
  conversionRate: number; // 0-100

  // Orders by pipeline stage (using stage names from response)
  ordersByStage: Record<string, number>;

  // Daily sales (last 30 days)
  dailySales: { date: string; total: number }[];

  // Totals for quick-access cards
  totalCustomers: number;
  openDeals: number;
  pendingOrders: number;

  // Recent orders (last 10)
  recentOrders: OrderDTO[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end: now };
}

function isWithinMonth(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function getLast30DaysRange(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSalesDashboard() {
  return useQuery<SalesDashboardData>({
    queryKey: ['sales', 'dashboard'],
    queryFn: async () => {
      // Fetch data in parallel — all with large limits to get full picture
      const [ordersRes, customersRes, dealsWonRes, dealsLostRes, dealsOpenRes] =
        await Promise.all([
          ordersService.listOrders({ page: 1, limit: 100 }),
          customersService.list({ page: 1, limit: 1 }),
          dealsService.list({ page: 1, limit: 1, status: 'WON' }),
          dealsService.list({ page: 1, limit: 1, status: 'LOST' }),
          dealsService.list({ page: 1, limit: 1, status: 'OPEN' }),
        ]);

      const allOrders = ordersRes.data;
      const { start, end } = getMonthRange();

      // Monthly orders (filter by createdAt within this month)
      const monthlyOrders = allOrders.filter(o =>
        isWithinMonth(o.createdAt, start, end)
      );

      // Revenue from completed orders this month (orders with confirmedAt set)
      const completedMonthlyOrders = monthlyOrders.filter(
        o => o.confirmedAt !== null
      );
      const monthlyRevenue = completedMonthlyOrders.reduce(
        (sum, o) => sum + o.grandTotal,
        0
      );

      const monthlyOrderCount = monthlyOrders.length;
      const averageTicket =
        monthlyOrderCount > 0 ? monthlyRevenue / monthlyOrderCount : 0;

      // Conversion rate: deals won / (won + lost) this month
      const wonCount = dealsWonRes.meta.total;
      const lostCount = dealsLostRes.meta.total;
      const totalClosed = wonCount + lostCount;
      const conversionRate =
        totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

      // Orders grouped by stage (we don't have stage names, so use stageId)
      // We'll compute a simple status from order properties
      const ordersByStage: Record<string, number> = {};
      for (const order of allOrders) {
        // Derive a display status from order state
        let status: string;
        if (order.cancelledAt) {
          status = 'CANCELLED';
        } else if (order.confirmedAt) {
          status = 'CONFIRMED';
        } else if (order.type === 'QUOTE') {
          status = 'QUOTE';
        } else {
          status = 'DRAFT';
        }
        ordersByStage[status] = (ordersByStage[status] ?? 0) + 1;
      }

      // Daily sales (last 30 days)
      const last30Days = getLast30DaysRange();
      const dailyMap = new Map<string, number>();
      for (const day of last30Days) {
        dailyMap.set(formatDateKey(day), 0);
      }
      for (const order of allOrders) {
        const d = new Date(order.createdAt);
        const key = formatDateKey(d);
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) ?? 0) + order.grandTotal);
        }
      }
      const dailySales = Array.from(dailyMap.entries()).map(
        ([date, total]) => ({ date, total })
      );

      // Pending orders (not confirmed, not cancelled)
      const pendingOrders = allOrders.filter(
        o => !o.confirmedAt && !o.cancelledAt
      ).length;

      // Recent orders (last 10)
      const recentOrders = [...allOrders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);

      return {
        monthlyRevenue,
        monthlyOrderCount,
        averageTicket,
        conversionRate,
        ordersByStage,
        dailySales,
        totalCustomers: customersRes.meta.total,
        openDeals: dealsOpenRes.meta.total,
        pendingOrders,
        recentOrders,
      };
    },
    staleTime: 60_000,
  });
}
