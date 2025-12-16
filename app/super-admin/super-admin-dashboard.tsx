"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import DashboardOverview from "../admin/overview/dashboard-overview";

const views = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Traffic" },
  { id: "engagement", label: "Engagement" },
  { id: "users", label: "Users & Sessions" },
  { id: "portfolio", label: "Portfolio & Revenue" },
  { id: "management", label: "User Management" },
] as const;

type TopPage = { path: string; _count: { _all: number } };
type CountryStat = { country: string | null; _count: { _all: number } };
type AnalyticsEvent = {
  id: string;
  createdAt: Date | string;
  sessionCartId?: string | null;
  path: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
};
type DevicesBreakdown = { desktop?: number; mobile?: number; tablet?: number; other?: number };
type UserRow = { id: string; name: string | null; email: string; role: string | null; createdAt: string | Date };

type AnalyticsSummary = {
  totalEvents: number;
  visitorsCount: number;
  topPages: TopPage[];
  countries: CountryStat[];
  recentEvents: AnalyticsEvent[];
  eventsToday: number;
  eventsYesterday: number;
  eventsLast7Days: number;
  currentOnlineVisitors: number;
  devices?: DevicesBreakdown | null;
  averageSessionDurationMs: number;
} & Record<string, unknown>;

type LatestSale = { id: string; user: { name?: string | null } | null; createdAt: Date | string; totalPrice: number | string };
type OverviewSummary = {
  totalSales: { _sum: { totalPrice?: string | number | null } };
  ordersCount: number;
  usersCount: number;
  productsCount: number;
  salesData: { month: string; totalSales: number }[];
};
type StoreSummary = OverviewSummary & { latestSales: LatestSale[] };
type RentTotals = { day: number; week: number; month: number; year: number };
type LandlordPortfolio = { id: string; name: string; subdomain: string; properties: number; units: number; tenants: number; rentCollected: number; subscriptionTier?: string };
type LocationBreakdown = { state?: string; city?: string; count: number };
type PlatformRevenue = {
  convenienceFees: RentTotals;
  cashoutFees: RentTotals;
  subscriptionRevenue: RentTotals;
  total: RentTotals;
};
type SubscriptionBreakdown = { free: number; growth: number; professional: number; enterprise: number };

type SuperAdminInsights = {
  landlordsCount: number;
  propertyManagersCount: number;
  propertiesCount: number;
  unitsCount: number;
  activeLeases: number;
  tenantsCount: number;
  landlordsPortfolio: LandlordPortfolio[];
  rentTotals: RentTotals;
  revenueMTD: number;
  revenuePrevMonth: number;
  arpuPerLandlord: number;
  collectionRate: number;
  expectedThisMonth: number;
  paidThisMonth: number;
  delinquencyBuckets: { "0-30": number; "31-60": number; "61+": number };
  landlordCohorts: { month: string; count: number }[];
  funnel: { signedUpLandlords: number; onboardedProperties: number; activeLeases: number; propertyManagers: number };
  lateRate: number;
  revenueTimeline: { month: string; total: number }[];
  locations: { states: LocationBreakdown[]; cities: LocationBreakdown[] };
  platformRevenue?: PlatformRevenue;
  subscriptionBreakdown?: SubscriptionBreakdown;
};

interface SuperAdminDashboardProps {
  userEmail: string;
  summary: StoreSummary;
  analytics: AnalyticsSummary;
  insights?: SuperAdminInsights;
  users?: UserRow[];
  currentUser?: Session["user"];
}

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return "0m";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}
function parseOS(userAgent?: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();

  if (ua.includes("windows nt")) return "Windows";
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("linux")) return "Linux";

  return "Other";
}

const SuperAdminDashboard = ({
  userEmail,
  summary,
  analytics,
  insights,
  users,
  currentUser,
}: SuperAdminDashboardProps) => {
  const [activeView, setActiveView] = useState<(typeof views)[number]["id"]>("overview");
  const [isClearingStats, startClearingStats] = useTransition();
  const [isDeletingUser, startDeletingUser] = useTransition();
  const [activeTrafficDetail, setActiveTrafficDetail] = useState<
    "today" | "yesterday" | "last7" | null
  >(null);
  const [mode, setMode] = useState<"live" | "test">("test");

  const {
    totalEvents,
    visitorsCount,
    topPages,
    countries,
    recentEvents,
    eventsToday,
    eventsYesterday,
    eventsLast7Days,
    currentOnlineVisitors,
    devices,
    averageSessionDurationMs,
  } = analytics;

  const osBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of recentEvents as AnalyticsEvent[]) {
      const os = parseOS(ev.userAgent);
      counts[os] = (counts[os] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [recentEvents]);

  const trafficDetailEvents = useMemo(() => {
    if (!activeTrafficDetail) return [] as AnalyticsEvent[];

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOf7DaysAgo = new Date(startOfToday);
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

    return recentEvents.filter((ev) => {
      const created = new Date(ev.createdAt);

      if (activeTrafficDetail === "today") {
        return created >= startOfToday;
      }

      if (activeTrafficDetail === "yesterday") {
        return created >= startOfYesterday && created < startOfToday;
      }

      if (activeTrafficDetail === "last7") {
        return created >= startOf7DaysAgo;
      }

      return false;
    });
  }, [activeTrafficDetail, recentEvents]);

  const handleClearStatistics = () => {
    if (!window.confirm("This will clear all tracked analytics statistics. Continue?")) return;

    startClearingStats(async () => {
      try {
        const res = await fetch("/api/analytics/reset", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.error("Failed to clear analytics statistics", data?.message);
          return;
        }
        window.location.reload();
      } catch (err) {
        console.error("Error clearing analytics statistics", err);
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    startDeletingUser(async () => {
      try {
        const res = await fetch("/api/super-admin/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.error("Failed to delete user", data?.message);
          alert("Failed to delete user");
          return;
        }
        window.location.reload();
      } catch (err) {
        console.error("Error deleting user", err);
        alert("Error deleting user");
      }
    });
  };

  const suspiciousSessionsMap = new Map<string, number>();
  for (const ev of recentEvents) {
    if (!ev.sessionCartId) continue;
    const current = suspiciousSessionsMap.get(ev.sessionCartId) || 0;
    suspiciousSessionsMap.set(ev.sessionCartId, current + 1);
  }
  const suspiciousSessions = Array.from(suspiciousSessionsMap.entries())
    .filter(([, count]) => count >= 20)
    .slice(0, 5);

  const managementContent = (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">User Management</h2>
          <p className="text-xs text-muted-foreground">Owner-only deletion. Destructive.</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {(users || []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name || "N/A"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">{u.role || "user"}</TableCell>
                  <TableCell>{formatDateTime(new Date(u.createdAt)).dateOnly}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                    >
                      {isDeletingUser ? "Deleting..." : "Delete"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  const dataControlsContent = (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Data Controls</CardTitle>
          <CardDescription className="text-xs">
            Switch test/live mode and clear demo Stripe data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className={`px-3 py-1 rounded-md border ${
                  mode === "test" ? "border-emerald-400 text-emerald-200" : "border-slate-700 text-slate-200"
                }`}
                onClick={() => setMode("test")}
              >
                Test
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md border ${
                  mode === "live" ? "border-emerald-400 text-emerald-200" : "border-slate-700 text-slate-200"
                }`}
                onClick={() => setMode("live")}
              >
                Live
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tie this toggle to env/config to switch data sources in revenue widgets.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm("Clear demo/test revenue orders?")) return;
              const res = await fetch("/api/super-admin/clear-demo-revenue", { method: "POST" });
              const data = await res.json();
              if (!res.ok || !data.success) {
                alert("Failed to clear demo revenue");
              } else {
                alert(`Cleared ${data.deleted || 0} demo orders`);
                window.location.reload();
              }
            }}
            className="w-full rounded-md bg-red-500/90 text-white text-sm font-semibold py-2 hover:bg-red-600"
          >
            Clear Demo Revenue
          </button>
        </CardContent>
      </Card>
    </div>
  );

  const overviewContent = (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          High-level overview of store performance, traffic, and activity for {userEmail}.
        </p>
      </section>

      {currentUser && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Current User Details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="font-medium">{currentUser.name || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser.email || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <p className="font-medium">{currentUser.role || "user"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Phone</p>
                <p className="font-medium">{currentUser.phoneNumber || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Phone Verified</p>
                <p className="font-medium">
                  {currentUser.phoneVerified ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-xs truncate">{currentUser.id}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {insights && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Portfolio Snapshot</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Landlords</p>
                <p className="text-2xl font-semibold">{formatNumber(insights.landlordsCount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Property Managers</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(insights.propertyManagersCount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Properties</p>
                <p className="text-2xl font-semibold">{formatNumber(insights.propertiesCount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Units</p>
                <p className="text-2xl font-semibold">{formatNumber(insights.unitsCount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Active Leases</p>
                <p className="text-2xl font-semibold">{formatNumber(insights.activeLeases)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Tenants (active)</p>
                <p className="text-2xl font-semibold">{formatNumber(insights.tenantsCount)}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Store Performance</h2>
        <DashboardOverview summary={summary} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Traffic Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Page Views</p>
              <p className="text-2xl font-semibold">{formatNumber(totalEvents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Unique Visitors</p>
              <p className="text-2xl font-semibold">{formatNumber(visitorsCount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Views / Visitor</p>
              <p className="text-2xl font-semibold">
                {visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Pages</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No traffic data yet.
                    </TableCell>
                  </TableRow>
                )}
                {topPages.map((p: TopPage) => (
                  <TableRow key={p.path}>
                    <TableCell>{p.path}</TableCell>
                    <TableCell className="text-right">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Countries</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No geo data yet.
                    </TableCell>
                  </TableRow>
                )}
                {countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`}>
                    <TableCell>{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent Paid Orders</h2>
          <Link href="/admin/orders" className="text-xs text-primary underline-offset-4 hover:underline">
            View all orders
          </Link>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BUYER</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>TOTAL</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.slice(0, 8).map((order: LatestSale) => (
                <TableRow key={order.id}>
                  <TableCell>{order?.user?.name || "Deleted User"}</TableCell>
                  <TableCell>{formatDateTime(new Date(order.createdAt)).dateOnly}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/order/${order.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  const trafficContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Traffic Summary</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Online Visitors</p>
              <p className="text-2xl font-semibold">{formatNumber(currentOnlineVisitors)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "today" ? null : "today"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Page Views Today</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsToday)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "yesterday" ? null : "yesterday"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Page Views Yesterday</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsYesterday)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "last7" ? null : "last7"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Last 7 Days Page Views</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsLast7Days)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {activeTrafficDetail && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {activeTrafficDetail === "today" && "Page Views Today - Detail"}
            {activeTrafficDetail === "yesterday" && "Page Views Yesterday - Detail"}
            {activeTrafficDetail === "last7" && "Last 7 Days Page Views - Detail"}
          </h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>OS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficDetailEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No matching events found in the recent window.
                    </TableCell>
                  </TableRow>
                )}
                {trafficDetailEvents.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[140px]">
                      {ev.sessionCartId}
                    </TableCell>
                    <TableCell>{ev.path}</TableCell>
                    <TableCell>
                      {[
                        ev.city || undefined,
                        ev.region || undefined,
                        ev.country || undefined,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell>{parseOS(ev.userAgent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Pages</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No traffic data yet.
                    </TableCell>
                  </TableRow>
                )}
                {topPages.map((p: TopPage) => (
                  <TableRow key={p.path}>
                    <TableCell>{p.path}</TableCell>
                    <TableCell className="text-right">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Countries</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No geo data yet.
                    </TableCell>
                  </TableRow>
                )}
                {countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`}>
                    <TableCell>{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );

  const engagementContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Engagement</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Session Length</p>
              <p className="text-2xl font-semibold">{formatDuration(averageSessionDurationMs)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Views / Visitor</p>
              <p className="text-2xl font-semibold">
                {visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>OS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No recent activity yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentEvents.map((ev: AnalyticsEvent) => (
                  <TableRow key={ev.id}>
                    <TableCell>{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[140px]">
                      {ev.sessionCartId}
                    </TableCell>
                    <TableCell>{ev.path}</TableCell>
                    <TableCell>
                      {[
                        ev.city || undefined,
                        ev.region || undefined,
                        ev.country || undefined,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell>{parseOS(ev.userAgent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Suspicious Activity (Heuristic)</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-2 text-sm">
            {suspiciousSessions.length === 0 && (
              <p className="text-muted-foreground">No obvious suspicious sessions detected recently.</p>
            )}
            {suspiciousSessions.map(([sessionId, count]) => (
              <div key={sessionId} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs truncate">{sessionId}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} page views in the recent window (possible bot or scraping).
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                  Flagged
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const usersContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Users & Sessions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Online Users</p>
              <p className="text-2xl font-semibold">{formatNumber(currentOnlineVisitors)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Unique Visitors (All Time)</p>
              <p className="text-2xl font-semibold">{formatNumber(visitorsCount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Session Length</p>
              <p className="text-2xl font-semibold">{formatDuration(averageSessionDurationMs)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Devices</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Desktop</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.desktop ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Mobile</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.mobile ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tablet</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.tablet ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Other</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.other ?? 0)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Operating Systems (Recent)</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden max-w-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead className="text-right">Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {osBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    No recent activity to determine OS distribution.
                  </TableCell>
                </TableRow>
              )}
              {osBreakdown.map(([os, count]) => (
                <TableRow key={os}>
                  <TableCell>{os}</TableCell>
                  <TableCell className="text-right">{formatNumber(count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  const portfolioContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Platform Revenue (Your Earnings)</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-emerald-950/50 border-emerald-800">
            <CardContent className="pt-4">
              <p className="text-xs text-emerald-300 mb-1">Today</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {formatCurrency(insights?.platformRevenue?.total.day ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-950/50 border-emerald-800">
            <CardContent className="pt-4">
              <p className="text-xs text-emerald-300 mb-1">This Week</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {formatCurrency(insights?.platformRevenue?.total.week ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-950/50 border-emerald-800">
            <CardContent className="pt-4">
              <p className="text-xs text-emerald-300 mb-1">This Month</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {formatCurrency(insights?.platformRevenue?.total.month ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-950/50 border-emerald-800">
            <CardContent className="pt-4">
              <p className="text-xs text-emerald-300 mb-1">This Year</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {formatCurrency(insights?.platformRevenue?.total.year ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Convenience Fees (Rent Payments)</p>
              <p className="text-lg font-semibold">
                {formatCurrency(insights?.platformRevenue?.convenienceFees.month ?? 0)}
                <span className="text-xs text-muted-foreground ml-1">this month</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Cashout Fees (Landlord Payouts)</p>
              <p className="text-lg font-semibold">
                {formatCurrency(insights?.platformRevenue?.cashoutFees.month ?? 0)}
                <span className="text-xs text-muted-foreground ml-1">this month</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Subscription Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrency(insights?.platformRevenue?.subscriptionRevenue.month ?? 0)}
                <span className="text-xs text-muted-foreground ml-1">this month</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Subscription Breakdown</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Free Tier</p>
              <p className="text-2xl font-semibold">
                {formatNumber(insights?.subscriptionBreakdown?.free ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Growth ($29.99/mo)</p>
              <p className="text-2xl font-semibold text-violet-400">
                {formatNumber(insights?.subscriptionBreakdown?.growth ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Professional ($79.99/mo)</p>
              <p className="text-2xl font-semibold text-violet-400">
                {formatNumber(insights?.subscriptionBreakdown?.professional ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Enterprise</p>
              <p className="text-2xl font-semibold text-violet-400">
                {formatNumber(insights?.subscriptionBreakdown?.enterprise ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Landlords & Managers</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Landlords</p>
              <p className="text-2xl font-semibold">
                {formatNumber(insights?.landlordsCount ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Property Managers</p>
              <p className="text-2xl font-semibold">
                {formatNumber(insights?.propertyManagersCount ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Properties</p>
              <p className="text-2xl font-semibold">
                {formatNumber(insights?.propertiesCount ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Units</p>
              <p className="text-2xl font-semibold">
                {formatNumber(insights?.unitsCount ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Rent Intake (All Landlords)</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(insights?.rentTotals.day ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(insights?.rentTotals.week ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(insights?.rentTotals.month ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">This Year</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(insights?.rentTotals.year ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Top Landlords by Portfolio</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Tenants</TableHead>
                <TableHead className="text-right">Rent Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(insights?.landlordsPortfolio || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    No landlord data yet.
                  </TableCell>
                </TableRow>
              )}
              {(insights?.landlordsPortfolio || [])
                .slice()
                .sort((a, b) => b.rentCollected - a.rentCollected)
                .slice(0, 10)
                .map((ll) => (
                  <TableRow key={ll.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ll.name}</span>
                        <span className="text-xs text-muted-foreground">{ll.subdomain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ll.subscriptionTier === 'enterprise' ? 'bg-amber-100 text-amber-800' :
                        ll.subscriptionTier === 'professional' ? 'bg-violet-100 text-violet-800' :
                        ll.subscriptionTier === 'growth' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ll.subscriptionTier || 'free'}
                      </span>
                    </TableCell>
                    <TableCell>{ll.properties}</TableCell>
                    <TableCell>{ll.units}</TableCell>
                    <TableCell>{ll.tenants}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ll.rentCollected)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Geography (Top States)</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(insights?.locations.states || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No location data yet.
                    </TableCell>
                  </TableRow>
                )}
                {(insights?.locations.states || []).map((loc) => (
                  <TableRow key={`${loc.state}-${loc.count}`}>
                    <TableCell>{loc.state || "Unknown"}</TableCell>
                    <TableCell className="text-right">{loc.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Geography (Top Cities)</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(insights?.locations.cities || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No location data yet.
                    </TableCell>
                  </TableRow>
                )}
                {(insights?.locations.cities || []).map((loc) => (
                  <TableRow key={`${loc.city}-${loc.count}`}>
                    <TableCell>{loc.city || "Unknown"}</TableCell>
                    <TableCell className="text-right">{loc.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Revenue Timeline</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden max-w-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Total Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(insights?.revenueTimeline || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    No revenue timeline yet.
                  </TableCell>
                </TableRow>
              )}
              {(insights?.revenueTimeline || []).map((item) => (
                <TableRow key={item.month}>
                  <TableCell className="font-mono text-xs">{item.month}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  let content = overviewContent;
  if (activeView === "traffic") content = trafficContent;
  else if (activeView === "engagement") content = engagementContent;
  else if (activeView === "users") content = usersContent;
  else if (activeView === "portfolio") content = portfolioContent;

  return (
    <div className="flex gap-6">
      <aside className="w-52 shrink-0 space-y-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Super Admin</CardTitle>
            <CardDescription className="text-xs">Deep visibility into users and visitors.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <button
              type="button"
              onClick={handleClearStatistics}
              disabled={isClearingStats}
              className="mt-1 w-full rounded-md bg-red-500/90 text-xs font-semibold text-white py-1.5 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isClearingStats ? "Clearing statistics..." : "Clear All Statistics"}
            </button>
          </CardContent>
        </Card>
        <nav className="flex flex-col gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                {
                  true: "bg-slate-800 text-slate-50",
                  false: "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50",
                }[String(activeView === view.id) as "true" | "false"]
              }`}
            >
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 space-y-6">{content}</main>
    </div>
  );
};

export default SuperAdminDashboard;
