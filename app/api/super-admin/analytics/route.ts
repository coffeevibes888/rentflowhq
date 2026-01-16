import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7d'; // 24h, 7d, 30d, 90d
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    // Get page views
    const pageViews = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Get unique sessions
    const sessions = await prisma.userSession.findMany({
      where: {
        startTime: { gte: startDate },
      },
      orderBy: { startTime: 'desc' },
    });

    // Get click events for heatmap
    const clicks = await prisma.clickEvent.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      take: 5000,
    });

    // Get form interactions
    const formInteractions = await prisma.formInteraction.findMany({
      where: {
        timestamp: { gte: startDate },
      },
    });

    // Get conversion funnel data
    const funnelSteps = await prisma.conversionFunnel.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      orderBy: { stepOrder: 'asc' },
    });

    // Calculate metrics
    const totalPageViews = pageViews.length;
    const uniqueVisitors = new Set(sessions.map(s => s.sessionId)).size;
    const totalSessions = sessions.length;
    const conversions = sessions.filter(s => s.converted).length;
    const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;
    
    // Average time on page
    const avgTimeOnPage = pageViews
      .filter(pv => pv.timeOnPage)
      .reduce((sum, pv) => sum + (pv.timeOnPage || 0), 0) / pageViews.filter(pv => pv.timeOnPage).length || 0;
    
    // Bounce rate
    const bounces = pageViews.filter(pv => pv.bounced).length;
    const bounceRate = totalPageViews > 0 ? (bounces / totalPageViews) * 100 : 0;
    
    // Average scroll depth
    const avgScrollDepth = pageViews
      .filter(pv => pv.scrollDepth)
      .reduce((sum, pv) => sum + (pv.scrollDepth || 0), 0) / pageViews.filter(pv => pv.scrollDepth).length || 0;

    // Top pages
    const pageStats = pageViews.reduce((acc, pv) => {
      acc[pv.path] = (acc[pv.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageStats)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Exit pages
    const exitPages = pageViews
      .filter(pv => pv.exitPage)
      .reduce((acc, pv) => {
        acc[pv.path] = (acc[pv.path] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topExitPages = Object.entries(exitPages)
      .map(([path, exits]) => ({ path, exits }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10);

    // Traffic sources
    const sources = sessions.reduce((acc, s) => {
      const source = s.utmSource || s.referrer || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const trafficSources = Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const devices = sessions.reduce((acc, s) => {
      const device = s.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Geographic data
    const countries = sessions.reduce((acc, s) => {
      const country = s.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCountries = Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Form abandonment
    const formStats = formInteractions.reduce((acc, fi) => {
      if (!acc[fi.formId]) {
        acc[fi.formId] = { started: 0, completed: 0, abandoned: 0 };
      }
      if (fi.action === 'focus') acc[fi.formId].started++;
      if (fi.action === 'submit') acc[fi.formId].completed++;
      return acc;
    }, {} as Record<string, { started: number; completed: number; abandoned: number }>);
    
    Object.keys(formStats).forEach(formId => {
      formStats[formId].abandoned = formStats[formId].started - formStats[formId].completed;
    });

    // Funnel analysis
    const funnelAnalysis = funnelSteps.reduce((acc, step) => {
      if (!acc[step.step]) {
        acc[step.step] = { total: 0, completed: 0 };
      }
      acc[step.step].total++;
      if (step.completed) acc[step.step].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Click heatmap data (grouped by page)
    const heatmapData = clicks.reduce((acc, click) => {
      if (!acc[click.path]) {
        acc[click.path] = [];
      }
      acc[click.path].push({
        x: click.xPosition,
        y: click.yPosition,
        element: click.elementTag,
        text: click.elementText,
      });
      return acc;
    }, {} as Record<string, Array<{ x: number | null; y: number | null; element: string; text: string | null }>>);

    // Time series data (page views by hour/day)
    const timeSeriesData = pageViews.reduce((acc, pv) => {
      const date = new Date(pv.createdAt);
      const key = timeRange === '24h' 
        ? `${date.getHours()}:00`
        : date.toISOString().split('T')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgTimeOnPage: Math.round(avgTimeOnPage / 1000), // convert to seconds
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgScrollDepth: Math.round(avgScrollDepth),
      },
      topPages,
      topExitPages,
      trafficSources,
      devices,
      topCountries,
      formStats,
      funnelAnalysis,
      heatmapData,
      timeSeriesData,
      recentSessions: sessions.slice(0, 50),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
