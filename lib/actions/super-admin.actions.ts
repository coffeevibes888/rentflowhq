'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { requireSuperAdmin } from '../auth-guard';

type RentAggregate = {
  day: number;
  week: number;
  month: number;
  year: number;
};

type PlatformRevenue = {
  convenienceFees: RentAggregate;
  cashoutFees: RentAggregate;
  subscriptionRevenue: RentAggregate;
  total: RentAggregate;
};

export async function getSuperAdminInsights() {
  try {
    await requireSuperAdmin();
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start

    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const startOfYear = new Date(startOfDay.getFullYear(), 0, 1);

    const [
      landlords,
      properties,
      units,
      leases,
      propertyManagersCount,
      rentPayments,
      platformFees,
      subscriptionEvents,
    ] = await Promise.all([
      prisma.landlord.findMany({
        include: {
          properties: {
            include: {
              units: {
                include: {
                  leases: {
                    include: {
                      rentPayments: true,
                    },
                  },
                },
              },
            },
          },
          subscription: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.property.findMany({
        include: { landlord: true },
      }),
      prisma.unit.findMany(),
      prisma.lease.findMany({
        where: { status: 'active' },
      }),
      prisma.user.count({ where: { role: 'property_manager' } }),
      prisma.rentPayment.findMany({
        where: {
          status: {
            in: ['paid', 'processing', 'pending', 'overdue', 'failed'],
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.platformFee.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.subscriptionEvent.findMany({
        where: {
          eventType: 'renewed',
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const landlordsCount = landlords.length;
    const propertiesCount = properties.length;
    const unitsCount = units.length;
    const activeLeases = leases.length;

    const landlordsPortfolio = landlords.map((landlord) => {
      const propertyCount = landlord.properties.length;
      let unitCount = 0;
      let tenantCount = 0;
      let rentCollected = 0;

      for (const property of landlord.properties) {
        unitCount += property.units.length;
        for (const unit of property.units) {
          tenantCount += unit.leases.length;
          for (const lease of unit.leases) {
            for (const payment of lease.rentPayments) {
              rentCollected += Number(payment.amount || 0);
            }
          }
        }
      }

      return {
        id: landlord.id,
        name: landlord.name,
        subdomain: landlord.subdomain,
        properties: propertyCount,
        units: unitCount,
        tenants: tenantCount,
        rentCollected,
        subscriptionTier: landlord.subscription?.tier || landlord.subscriptionTier || 'free',
      };
    });

    const rentTotals: RentAggregate = { day: 0, week: 0, month: 0, year: 0 };
    const revenueTimelineMap = new Map<string, number>(); // key: YYYY-MM
    let revenueMTD = 0;
    let revenuePrevMonth = 0;
    let expectedThisMonth = 0;
    let paidThisMonth = 0;
    let overdueCount = 0;
    const delinquencyBuckets: Record<'0-30' | '31-60' | '61+', number> = {
      '0-30': 0,
      '31-60': 0,
      '61+': 0,
    };

    const convenienceFees: RentAggregate = { day: 0, week: 0, month: 0, year: 0 };

    for (const payment of rentPayments) {
      const paidAt = payment.paidAt || payment.createdAt;
      const value = Number(payment.amount || 0);
      const fee = Number(payment.convenienceFee || 0);

      if (paidAt) {
        if (paidAt >= startOfDay) {
          rentTotals.day += value;
          convenienceFees.day += fee;
        }
        if (paidAt >= startOfWeek) {
          rentTotals.week += value;
          convenienceFees.week += fee;
        }
        if (paidAt >= startOfMonth) {
          rentTotals.month += value;
          convenienceFees.month += fee;
        }
        if (paidAt >= startOfYear) {
          rentTotals.year += value;
          convenienceFees.year += fee;
        }

        const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
        revenueTimelineMap.set(key, (revenueTimelineMap.get(key) || 0) + value);

        const isCurrentMonth =
          paidAt.getFullYear() === startOfMonth.getFullYear() &&
          paidAt.getMonth() === startOfMonth.getMonth();
        const prevMonthDate = new Date(startOfMonth);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const isPrevMonth =
          paidAt.getFullYear() === prevMonthDate.getFullYear() &&
          paidAt.getMonth() === prevMonthDate.getMonth();

        if (isCurrentMonth && payment.status === 'paid') {
          paidThisMonth += value;
          revenueMTD += value;
        } else if (isPrevMonth && payment.status === 'paid') {
          revenuePrevMonth += value;
        }
      }

      if (payment.dueDate) {
        const due = payment.dueDate;
        const isDueThisMonth =
          due.getFullYear() === startOfMonth.getFullYear() &&
          due.getMonth() === startOfMonth.getMonth();
        if (isDueThisMonth) {
          expectedThisMonth += value;
        }
      }

      if (payment.dueDate && payment.status !== 'paid') {
        const nowDate = new Date();
        const diffDays = Math.floor(
          (nowDate.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 0) {
          overdueCount += 1;
          if (diffDays <= 30) delinquencyBuckets['0-30'] += 1;
          else if (diffDays <= 60) delinquencyBuckets['31-60'] += 1;
          else delinquencyBuckets['61+'] += 1;
        }
      }
    }

    const cashoutFees: RentAggregate = { day: 0, week: 0, month: 0, year: 0 };
    for (const fee of platformFees) {
      const createdAt = fee.createdAt;
      const value = Number(fee.amount || 0);

      if (createdAt >= startOfDay) cashoutFees.day += value;
      if (createdAt >= startOfWeek) cashoutFees.week += value;
      if (createdAt >= startOfMonth) cashoutFees.month += value;
      if (createdAt >= startOfYear) cashoutFees.year += value;
    }

    const subscriptionRevenue: RentAggregate = { day: 0, week: 0, month: 0, year: 0 };
    for (const event of subscriptionEvents) {
      const createdAt = event.createdAt;
      const value = Number(event.amount || 0);

      if (createdAt >= startOfDay) subscriptionRevenue.day += value;
      if (createdAt >= startOfWeek) subscriptionRevenue.week += value;
      if (createdAt >= startOfMonth) subscriptionRevenue.month += value;
      if (createdAt >= startOfYear) subscriptionRevenue.year += value;
    }

    const platformRevenue: PlatformRevenue = {
      convenienceFees,
      cashoutFees,
      subscriptionRevenue,
      total: {
        day: convenienceFees.day + cashoutFees.day + subscriptionRevenue.day,
        week: convenienceFees.week + cashoutFees.week + subscriptionRevenue.week,
        month: convenienceFees.month + cashoutFees.month + subscriptionRevenue.month,
        year: convenienceFees.year + cashoutFees.year + subscriptionRevenue.year,
      },
    };

    const revenueTimeline = Array.from(revenueTimelineMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, total]) => ({ month, total }));

    const stateDistribution: Record<string, number> = {};
    const cityDistribution: Record<string, number> = {};

    for (const property of properties) {
      const address = (property.address as Record<string, any>) || {};
      const state = (address.state || address.stateCode || '').toString().trim();
      const city = (address.city || '').toString().trim();

      if (state) stateDistribution[state] = (stateDistribution[state] || 0) + 1;
      if (city) cityDistribution[city] = (cityDistribution[city] || 0) + 1;
    }

    const landlordCohorts = landlords.reduce<Record<string, number>>((acc, landlord) => {
      const created = landlord.createdAt;
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const subscriptionBreakdown = {
      free: landlords.filter(l => (l.subscription?.tier || l.subscriptionTier || 'free') === 'free').length,
      growth: landlords.filter(l => (l.subscription?.tier || l.subscriptionTier) === 'growth').length,
      professional: landlords.filter(l => (l.subscription?.tier || l.subscriptionTier) === 'professional').length,
      enterprise: landlords.filter(l => (l.subscription?.tier || l.subscriptionTier) === 'enterprise').length,
    };

    const collectionRate =
      expectedThisMonth > 0 ? Math.min(1, paidThisMonth / expectedThisMonth) : 0;

    const arpuPerLandlord = landlordsCount > 0 ? paidThisMonth / landlordsCount : 0;

    const lateRate =
      rentPayments.length > 0 ? overdueCount / rentPayments.length : 0;

    const funnel = {
      signedUpLandlords: landlordsCount,
      onboardedProperties: propertiesCount,
      activeLeases,
      propertyManagers: propertyManagersCount,
    };

    const landlordCohortsArr = Object.entries(landlordCohorts)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, count]) => ({ month, count }));

    const locations = {
      states: Object.entries(stateDistribution)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      cities: Object.entries(cityDistribution)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };

    return {
      landlordsCount,
      propertyManagersCount,
      propertiesCount,
      unitsCount,
      activeLeases,
      tenantsCount: leases.length,
      landlordsPortfolio,
      rentTotals,
      revenueMTD,
      revenuePrevMonth,
      arpuPerLandlord,
      collectionRate,
      expectedThisMonth,
      paidThisMonth,
      delinquencyBuckets,
      landlordCohorts: landlordCohortsArr,
      funnel,
      lateRate,
      revenueTimeline,
      locations,
      platformRevenue,
      subscriptionBreakdown,
    };
  } catch (error) {
    console.error('Failed to load super admin insights', formatError(error));
    return {
      landlordsCount: 0,
      propertyManagersCount: 0,
      propertiesCount: 0,
      unitsCount: 0,
      activeLeases: 0,
      tenantsCount: 0,
      landlordsPortfolio: [],
      rentTotals: { day: 0, week: 0, month: 0, year: 0 },
      revenueMTD: 0,
      revenuePrevMonth: 0,
      arpuPerLandlord: 0,
      collectionRate: 0,
      expectedThisMonth: 0,
      paidThisMonth: 0,
      delinquencyBuckets: { '0-30': 0, '31-60': 0, '61+': 0 },
      landlordCohorts: [],
      funnel: { signedUpLandlords: 0, onboardedProperties: 0, activeLeases: 0, propertyManagers: 0 },
      lateRate: 0,
      revenueTimeline: [],
      locations: { states: [], cities: [] },
      platformRevenue: {
        convenienceFees: { day: 0, week: 0, month: 0, year: 0 },
        cashoutFees: { day: 0, week: 0, month: 0, year: 0 },
        subscriptionRevenue: { day: 0, week: 0, month: 0, year: 0 },
        total: { day: 0, week: 0, month: 0, year: 0 },
      },
      subscriptionBreakdown: { free: 0, growth: 0, professional: 0, enterprise: 0 },
    };
  }
}

export async function listUsersForSuperAdmin(limit = 100) {
  await requireSuperAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function deleteUserBySuperAdmin(userId: string) {
  await requireSuperAdmin();
  if (!userId) throw new Error('User id required');
  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}

export async function clearDemoRevenueData() {
  await requireSuperAdmin();
  // Delete only obviously demo/test orders (safe guard).
  const result = await prisma.order.deleteMany({
    where: {
      OR: [
        { paymentMethod: 'demo' },
        { paymentMethod: 'test' },
      ],
    },
  });
  return { success: true, deleted: result.count };
}
