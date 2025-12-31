import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import PDFDocument from 'pdfkit';

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

  private async loadLogoBuffer(logoUrl?: string): Promise<Buffer | null> {
    if (!logoUrl) return null;
    const fetchFn = (globalThis as any).fetch as
      | ((input: any, init?: any) => Promise<any>)
      | undefined;
    if (!fetchFn) return null;
    try {
      const response = await fetchFn(logoUrl);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      return null;
    }
  }

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

  private buildPdf(
    title: string,
    subtitle: string,
    summaryCards: { label: string; value: string | number }[],
    tables: Array<{
      title: string;
      columns: { header: string; key: string; width: number; align?: string }[];
      rows: Record<string, any>[];
    }>,
    logoBuffer?: Buffer | null,
  ) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    const primaryColor = '#1e40af';
    const secondaryColor = '#3b82f6';
    const grayColor = '#6b7280';
    const lightGray = '#f3f4f6';
    const white = '#ffffff';

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    // Header
    doc.rect(0, 0, doc.page.width, 140).fill(lightGray);
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(title, 50, 40);
    doc.rect(50, 70, 50, 3).fill(secondaryColor);

    doc
      .fillColor('black')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(subtitle, 50, 90);

    if (logoBuffer) {
      try {
        const logoWidth = 90;
        const logoHeight = 50;
        const x = doc.page.width - logoWidth - 50;
        const y = 30;
        doc.image(logoBuffer, x, y, {
          fit: [logoWidth, logoHeight],
          align: 'right',
          valign: 'center',
        });
      } catch (error) {
        // ignore logo errors
      }
    }

    // Summary cards
    const summaryY = 160;
    const boxWidth = 120;
    const boxHeight = 70;
    const gap = 15;

    const drawSummaryCard = (
      x: number,
      y: number,
      label: string,
      value: string | number,
    ) => {
      doc.rect(x + 2, y + 2, boxWidth, boxHeight).fillColor('#e5e7eb').fill();
      doc.rect(x, y, boxWidth, boxHeight).fillColor(white).fill();
      doc.rect(x, y, boxWidth, boxHeight).strokeColor('#e5e7eb').stroke();
      doc.rect(x, y, boxWidth, 3).fillColor(primaryColor).fill();
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(label.toUpperCase(), x + 10, y + 15);
      doc
        .fillColor('black')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(String(value), x + 10, y + 35);
    };

    summaryCards.forEach((card, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 50 + col * (boxWidth + gap);
      const y = summaryY + row * (boxHeight + gap);
      drawSummaryCard(x, y, card.label, card.value);
    });

    const summaryRows = Math.ceil(summaryCards.length / 4);
    doc.y = summaryY + summaryRows * (boxHeight + gap) + 30;

    const drawTable = (
      titleText: string,
      data: any[],
      columns: { header: string; key: string; width: number; align?: string }[],
    ) => {
      if (doc.y + 100 > doc.page.height) doc.addPage();

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(titleText, 50, doc.y);
      doc.moveDown(0.5);

      const startX = 50;
      let currentY = doc.y;
      const rowHeight = 25;

      doc.rect(startX, currentY, 500, rowHeight).fill(lightGray);
      let colX = startX + 10;

      doc.fillColor('black').fontSize(9).font('Helvetica-Bold');
      columns.forEach((col) => {
        doc.text(col.header, colX, currentY + 8, {
          width: col.width,
          align: (col.align as any) || 'left',
        });
        colX += col.width;
      });

      currentY += rowHeight;
      doc.font('Helvetica').fontSize(9);

      data.forEach((row, index) => {
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }
        if (index % 2 === 0) {
          doc.rect(startX, currentY, 500, rowHeight).fill('#fafafa');
        }
        doc
          .moveTo(startX, currentY + rowHeight)
          .lineTo(startX + 500, currentY + rowHeight)
          .strokeColor('#e5e7eb')
          .stroke();

        let cellX = startX + 10;
        doc.fillColor('#374151');
        columns.forEach((col) => {
          const textValue = String(row[col.key] ?? '');
          doc.text(textValue, cellX, currentY + 8, {
            width: col.width,
            align: (col.align as any) || 'left',
          });
          cellX += col.width;
        });

        currentY += rowHeight;
      });

      doc.y = currentY + 30;
    };

    tables.forEach((t) => drawTable(t.title, t.rows, t.columns));

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async getPerformanceReportPdf(
    startDate: string,
    endDate: string,
    logoUrl?: string,
  ) {
    const data = await this.getPerformanceReport({ start: startDate, end: endDate });
    const logoBuffer = await this.loadLogoBuffer(logoUrl);

    const summaryCards = [
      { label: 'Total Calls', value: data.kpis.totalCalls },
      { label: 'Closed Tickets', value: data.kpis.closedTickets },
      { label: 'Open Tickets', value: data.kpis.openTickets },
      { label: 'Resolution Rate', value: `${data.kpis.resolutionRate}%` },
      {
        label: 'Avg Call Duration',
        value: `${Math.floor(data.kpis.avgDurationSeconds / 60)}m ${
          data.kpis.avgDurationSeconds % 60
        }s`,
      },
      { label: 'Active Agents', value: data.kpis.activeAgents },
    ];

    const tables = [
      {
        title: 'Calls by Day',
        columns: [
          { header: 'Date', key: 'date', width: 160 },
          { header: 'Day', key: 'day', width: 100 },
          { header: 'Total', key: 'total', width: 100, align: 'center' },
          { header: 'Closed', key: 'closed', width: 100, align: 'center' },
        ],
        rows: data.callsByDay,
      },
      {
        title: 'Disposition Breakdown',
        columns: [
          { header: 'Disposition', key: 'name', width: 260 },
          { header: 'Count', key: 'value', width: 120, align: 'center' },
        ],
        rows: data.dispositionBreakdown,
      },
      {
        title: 'Campaign Breakdown',
        columns: [
          { header: 'Campaign', key: 'name', width: 260 },
          { header: 'Count', key: 'value', width: 120, align: 'center' },
        ],
        rows: data.campaignBreakdown,
      },
      {
        title: 'Status Breakdown',
        columns: [
          { header: 'Status', key: 'name', width: 260 },
          { header: 'Count', key: 'value', width: 120, align: 'center' },
        ],
        rows: data.statusBreakdown,
      },
      {
        title: 'Agent Performance',
        columns: [
          { header: 'Agent', key: 'name', width: 200 },
          { header: 'Total', key: 'totalTickets', width: 80, align: 'center' },
          { header: 'Closed', key: 'closedTickets', width: 80, align: 'center' },
          {
            header: 'Avg Duration',
            key: 'avgDurationSeconds',
            width: 120,
            align: 'center',
          },
        ],
        rows: data.agentPerformance.map((a) => ({
          ...a,
          avgDurationSeconds: `${Math.floor(a.avgDurationSeconds / 60)}m ${
            a.avgDurationSeconds % 60
          }s`,
        })),
      },
    ];

    const subtitle = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(
      data.period.end,
    ).toLocaleDateString()}`;
    return this.buildPdf('PERFORMANCE REPORT', `RANGE: ${subtitle}`, summaryCards, tables, logoBuffer);
  }

  async getAgentsReportPdf(
    startDate: string,
    endDate: string,
    logoUrl?: string,
  ) {
    const data = await this.getAgentsReport({ start: startDate, end: endDate });
    const logoBuffer = await this.loadLogoBuffer(logoUrl);

    const summaryCards = [
      { label: 'Total Agents', value: data.kpis.totalAgents },
      { label: 'Total Tickets', value: data.kpis.totalTickets },
      { label: 'Closed Tickets', value: data.kpis.closedTickets },
      { label: 'Open Tickets', value: data.kpis.openTickets },
      { label: 'Resolution Rate', value: `${data.kpis.resolutionRate}%` },
      {
        label: 'Avg Duration',
        value: `${Math.floor(data.kpis.avgDurationSeconds / 60)}m ${
          data.kpis.avgDurationSeconds % 60
        }s`,
      },
    ];

    const tables = [
      {
        title: 'Agent Performance',
        columns: [
          { header: 'Agent', key: 'name', width: 200 },
          { header: 'Active', key: 'isActive', width: 80, align: 'center' },
          { header: 'Total', key: 'totalTickets', width: 80, align: 'center' },
          { header: 'Closed', key: 'closedTickets', width: 80, align: 'center' },
          { header: 'Open', key: 'openTickets', width: 80, align: 'center' },
          {
            header: 'Resolution',
            key: 'resolutionRate',
            width: 100,
            align: 'center',
          },
          {
            header: 'Avg Duration',
            key: 'avgDurationSeconds',
            width: 120,
            align: 'center',
          },
        ],
        rows: data.agents.map((agent) => ({
          ...agent,
          isActive: agent.isActive ? 'Yes' : 'No',
          avgDurationSeconds: `${Math.floor(agent.avgDurationSeconds / 60)}m ${
            agent.avgDurationSeconds % 60
          }s`,
        })),
      },
    ];

    const subtitle = `${new Date(data.period.start).toLocaleDateString()} - ${new Date(
      data.period.end,
    ).toLocaleDateString()}`;
    return this.buildPdf('AGENTS REPORT', `RANGE: ${subtitle}`, summaryCards, tables, logoBuffer);
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
