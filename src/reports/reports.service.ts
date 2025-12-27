import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';

type ReportQuery = {
  period?: string;
  start?: string;
  end?: string;
};

type DayBucket = {
  date: string;
  day: string;
  total: number;
  closed: number;
};

const STATUS_CLOSED = new Set(['CLOSED', 'RESOLVED']);

const CAMPAIGN_LABELS: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  AR: 'AR',
  OTHER: 'Other',
};

const DISPOSITION_LABELS: Record<string, string> = {
  BOOKING: 'Booking',
  GENERAL_INFO: 'General Info',
  COMPLAINT: 'Complaint',
  SUPPORT: 'Support',
  BILLING: 'Billing',
  TECHNICAL_ISSUE: 'Technical Issue',
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async getPerformanceReport(query: ReportQuery) {
    const { startDate, endDate, label } = this.resolveDateRange(query);

    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignedTo', 'agent')
      .where('ticket.createdAt BETWEEN :start AND :end', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      })
      .orderBy('ticket.createdAt', 'ASC')
      .getMany();

    const totalCalls = tickets.length;
    const closedTickets = tickets.filter((ticket) =>
      STATUS_CLOSED.has(ticket.status),
    ).length;
    const openTickets = tickets.filter(
      (ticket) => !STATUS_CLOSED.has(ticket.status),
    ).length;

    const durations = tickets
      .map((ticket) => ticket.duration || 0)
      .filter((value) => value > 0);
    const avgDurationSeconds = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

    const callsByDay = this.buildDailyBuckets(startDate, endDate, tickets);

    const dispositionBreakdown = this.buildBreakdown(
      tickets.map((ticket) => ticket.disposition || 'UNSPECIFIED'),
      DISPOSITION_LABELS,
    );

    const campaignBreakdown = this.buildBreakdown(
      tickets.map((ticket) => ticket.campaign?.nombre || 'UNSPECIFIED'),
      CAMPAIGN_LABELS,
    );

    const statusBreakdown = this.buildBreakdown(
      tickets.map((ticket) => ticket.status || 'UNSPECIFIED'),
    );

    const agentPerformance = this.buildAgentPerformance(tickets);

    return {
      period: {
        label,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      kpis: {
        totalCalls,
        closedTickets,
        openTickets,
        resolutionRate: totalCalls
          ? Math.round((closedTickets / totalCalls) * 100)
          : 0,
        avgDurationSeconds,
        activeAgents: agentPerformance.length,
      },
      callsByDay,
      dispositionBreakdown,
      campaignBreakdown,
      statusBreakdown,
      agentPerformance,
    };
  }

  async getAgentsReport(query: ReportQuery) {
    const { startDate, endDate, label } = this.resolveDateRange(query);

    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignedTo', 'agent')
      .where('ticket.createdAt BETWEEN :start AND :end', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      })
      .orderBy('ticket.createdAt', 'ASC')
      .getMany();

    const totalTickets = tickets.length;
    const closedTickets = tickets.filter((ticket) =>
      STATUS_CLOSED.has(ticket.status),
    ).length;
    const openTickets = totalTickets - closedTickets;
    const durations = tickets
      .map((ticket) => ticket.duration || 0)
      .filter((value) => value > 0);
    const avgDurationSeconds = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

    const agentPerformance = this.buildAgentPerformance(tickets);

    const topByVolume = agentPerformance[0] || null;
    const topByResolution = [...agentPerformance].sort(
      (a, b) => b.resolutionRate - a.resolutionRate,
    )[0] || null;
    const topByDuration = [...agentPerformance]
      .filter((agent) => agent.avgDurationSeconds > 0)
      .sort((a, b) => a.avgDurationSeconds - b.avgDurationSeconds)[0] || null;

    return {
      period: {
        label,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      kpis: {
        totalAgents: agentPerformance.length,
        totalTickets,
        closedTickets,
        openTickets,
        resolutionRate: totalTickets
          ? Math.round((closedTickets / totalTickets) * 100)
          : 0,
        avgDurationSeconds,
      },
      topPerformers: {
        byVolume: topByVolume,
        byResolution: topByResolution,
        byDuration: topByDuration,
      },
      agents: agentPerformance,
    };
  }

  private resolveDateRange(query: ReportQuery) {
    const now = new Date();
    const endDate = query.end ? new Date(query.end) : now;
    endDate.setHours(23, 59, 59, 999);

    if (query.start) {
      const startDate = new Date(query.start);
      startDate.setHours(0, 0, 0, 0);
      return {
        startDate,
        endDate,
        label: 'Custom range',
      };
    }

    const period = query.period || '7d';
    const days =
      period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    return {
      startDate,
      endDate,
      label: `Last ${days} days`,
    };
  }

  private buildDailyBuckets(startDate: Date, endDate: Date, tickets: Ticket[]) {
    const buckets: DayBucket[] = [];
    const dateCursor = new Date(startDate);

    while (dateCursor <= endDate) {
      buckets.push({
        date: this.formatDateKey(dateCursor),
        day: dateCursor.toLocaleDateString('en-US', { weekday: 'short' }),
        total: 0,
        closed: 0,
      });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    const indexByDate = buckets.reduce<Record<string, number>>((acc, bucket, index) => {
      acc[bucket.date] = index;
      return acc;
    }, {});

    tickets.forEach((ticket) => {
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const key = this.formatDateKey(createdAt);
      const bucketIndex = indexByDate[key];
      if (bucketIndex === undefined) return;
      buckets[bucketIndex].total += 1;
      if (STATUS_CLOSED.has(ticket.status)) {
        buckets[bucketIndex].closed += 1;
      }
    });

    return buckets;
  }

  private buildBreakdown(values: Array<string | null | undefined>, labels?: Record<string, string>) {
    const counts = values.reduce<Record<string, number>>((acc, value) => {
      const label = this.normalizeLabel(value || 'UNSPECIFIED', labels);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }

  private buildAgentPerformance(tickets: Ticket[]) {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        isActive?: boolean;
        totalTickets: number;
        closedTickets: number;
        openTickets: number;
        resolutionRate: number;
        avgDurationSeconds: number;
      }
    >();
    const durations = new Map<number, number[]>();

    tickets.forEach((ticket) => {
      const agent = ticket.assignedTo;
      if (!agent) return;
      const existing = map.get(agent.id) || {
        id: agent.id,
        name: agent.name,
        isActive: agent.isActive,
        totalTickets: 0,
        closedTickets: 0,
        openTickets: 0,
        resolutionRate: 0,
        avgDurationSeconds: 0,
      };
      existing.totalTickets += 1;
      if (STATUS_CLOSED.has(ticket.status)) {
        existing.closedTickets += 1;
      }
      map.set(agent.id, existing);

      if (ticket.duration && ticket.duration > 0) {
        const list = durations.get(agent.id) || [];
        list.push(ticket.duration);
        durations.set(agent.id, list);
      }
    });

    const results = Array.from(map.values()).map((item) => {
      const list = durations.get(item.id) || [];
      const avgDurationSeconds = list.length
        ? Math.round(list.reduce((sum, value) => sum + value, 0) / list.length)
        : 0;
      const openTickets = item.totalTickets - item.closedTickets;
      const resolutionRate = item.totalTickets
        ? Math.round((item.closedTickets / item.totalTickets) * 100)
        : 0;
      return {
        ...item,
        openTickets,
        resolutionRate,
        avgDurationSeconds,
      };
    });

    return results.sort((a, b) => b.totalTickets - a.totalTickets);
  }

  private normalizeLabel(value: string, labels?: Record<string, string>) {
    if (!value) return 'Unspecified';
    if (labels && labels[value]) return labels[value];
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
