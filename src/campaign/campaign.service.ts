import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Yard } from '../yards/entities/yard.entity';
import PDFDocument from 'pdfkit';
import {
  CallDirection,
  CampaignOption,
  Ticket,
} from '../ticket/entities/ticket.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,

    @InjectRepository(Yard)
    private readonly yardRepo: Repository<Yard>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  // --- PDF Helpers ---
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

  private buildCampaignReportPdf(report: any, logoBuffer?: Buffer | null) {
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
      .text('CAMPAIGN REPORT', 50, 40);
    doc.rect(50, 70, 50, 3).fill(secondaryColor);

    // Campaign info
    doc
      .fillColor('black')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('CAMPAIGN:', 50, 90);
    doc.font('Helvetica').fontSize(12).text(report.campaign.nombre, 50, 105);
    if (report.campaign.yardaName) {
      doc
        .fontSize(10)
        .fillColor(grayColor)
        .text(report.campaign.yardaName, 50, 120);
    }

    // Range (right)
    const dateTextX = 400;
    doc
      .fillColor('black')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('REPORT RANGE:', dateTextX, 90);
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(
        `${new Date(report.range.startDate).toLocaleDateString()} - ${new Date(report.range.endDate).toLocaleDateString()}`,
        dateTextX,
        105,
      );

    // Logo
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

    const summaryY = 160;
    const boxWidth = 120;
    const boxHeight = 70;
    const gap = 15;

    const drawSummaryCard = (
      x: number,
      y: number,
      title: string,
      value: string | number,
      color: string,
    ) => {
      doc
        .rect(x + 2, y + 2, boxWidth, boxHeight)
        .fillColor('#e5e7eb')
        .fill();
      doc.rect(x, y, boxWidth, boxHeight).fillColor(white).fill();
      doc.rect(x, y, boxWidth, boxHeight).strokeColor('#e5e7eb').stroke();
      doc.rect(x, y, boxWidth, 3).fillColor(color).fill();
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(title.toUpperCase(), x + 10, y + 15);
      doc
        .fillColor('black')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(String(value), x + 10, y + 35);
    };

    const metrics = report.metrics || [];
    metrics.forEach((metric: any, index: number) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 50 + col * (boxWidth + gap);
      const y = summaryY + row * (boxHeight + gap);
      const color = metric.color || primaryColor;
      drawSummaryCard(x, y, metric.title, metric.value, color);
    });

    const rows = Math.ceil(metrics.length / 4);
    doc.y = summaryY + rows * (boxHeight + gap) + 40;

    const drawTable = (
      title: string,
      data: any[],
      columns: { header: string; width: number; key: string; align?: string }[],
    ) => {
      if (doc.y + 100 > doc.page.height) doc.addPage();

      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(title, 50, doc.y);
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
          const textValue = String(row[col.key] || 0);
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

    // Detailed tables per action/status with customers
    const detailColumns = [
      { header: 'CUSTOMER', width: 200, key: 'name' },
      { header: 'PHONE', width: 120, key: 'phone' },
      { header: 'STATUS', width: 100, key: 'status' },
      { header: 'NOTES', width: 120, key: 'note' },
    ];
    (report.tables || []).forEach((table: any) => {
      drawTable(table.title, table.rows, detailColumns);
    });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async getCampaignReportData(
    campaignId: number,
    startDate: string,
    endDate: string,
  ) {
    return this.buildCampaignReportData(campaignId, startDate, endDate);
  }

  private async getTicketCounts(campaigns: Campaign[]) {
    const campaignIds = Array.from(
      new Set(campaigns.map((campaign) => campaign.id).filter(Boolean)),
    ) as number[];

    if (campaignIds.length === 0) {
      return new Map<number, number>();
    }

    const rows = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select('ticket.campaignId', 'campaignId')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.campaignId IN (:...campaignIds)', { campaignIds })
      .groupBy('ticket.campaignId')
      .getRawMany<{ campaignId: number; count: string }>();

    const counts = new Map<number, number>();
    rows.forEach((row) => {
      counts.set(row.campaignId, Number(row.count));
    });

    return counts;
  }

  private normalizeDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ConflictException('Invalid date range');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private normalizeLabel(value: string) {
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private getCustomerName(ticket: Ticket) {
    return (
      ticket.customer?.name ||
      ticket.customerPhone ||
      ticket.customer?.phone ||
      `Customer #${ticket.customerId || ticket.id}`
    );
  }

  private getCustomerPhone(ticket: Ticket) {
    return ticket.customerPhone || ticket.customer?.phone || '';
  }

  private async buildCampaignReportData(
    campaignId: number,
    startDate: string,
    endDate: string,
  ) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: ['yarda'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const { start, end } = this.normalizeDateRange(startDate, endDate);

    const tickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.customer', 'customer')
      .where('ticket.campaignId = :campaignId', { campaignId })
      .andWhere('ticket.createdAt BETWEEN :start AND :end', { start, end })
      .getMany();

    const isAr = (campaign.tipo || '').toUpperCase() === 'AR';
    const missed = tickets.filter(
      (t) => (t.direction || '').toUpperCase() === CallDirection.MISSED,
    ).length;

    const arLabels: Record<string, string> = {
      PAID: 'Paid',
      NOT_PAID: 'Not Paid',
      OFFLINE_PAYMENT: 'Offline Payment',
      NOT_PAID_CHECK: 'Not Paid Check',
      MOVED_OUT: 'Moved Out',
      CANCELED: 'Canceled',
      BALANCE_0: 'Balance 0',
      DO_NOT_CALL: 'Do Not Call',
    };

    const onboardingBuckets: Record<string, number> = {
      Registered: 0,
      'Not Registered': 0,
      'Paid with LL': 0,
      Unknown: 0,
    };

    const arBuckets: Record<string, number> = {
      Paid: 0,
      'Not Paid': 0,
      'Offline Payment': 0,
      'Not Paid Check': 0,
      'Moved Out': 0,
      Canceled: 0,
      'Balance 0': 0,
      'Do Not Call': 0,
      Unspecified: 0,
    };

    const arRows: Record<
      string,
      { name: string; phone: string; status: string; note: string }[]
    > = {};

    const onboardingRows: Record<
      string,
      { name: string; phone: string; status: string; note: string }[]
    > = {
      Registered: [],
      'Not Registered': [],
      'Paid with LL': [],
      Unknown: [],
    };

    tickets.forEach((ticket) => {
      const option = ticket.campaignOption as CampaignOption | null;
      if (isAr) {
        const label = arLabels[option || ''] || 'Unspecified';
        arBuckets[label] = (arBuckets[label] || 0) + 1;
        const list = arRows[label] || [];
        list.push({
          name: this.getCustomerName(ticket),
          phone: this.getCustomerPhone(ticket),
          status: label,
          note: ticket.issueDetail || '',
        });
        arRows[label] = list;
      } else {
        switch (option) {
          case CampaignOption.REGISTER:
            onboardingBuckets.Registered += 1;
            onboardingRows.Registered.push({
              name: this.getCustomerName(ticket),
              phone: this.getCustomerPhone(ticket),
              status: 'Registered',
              note: ticket.issueDetail || '',
            });
            break;
          case CampaignOption.NOT_REGISTER:
            onboardingBuckets['Not Registered'] += 1;
            onboardingRows['Not Registered'].push({
              name: this.getCustomerName(ticket),
              phone: this.getCustomerPhone(ticket),
              status: 'Not Registered',
              note: ticket.issueDetail || '',
            });
            break;
          case CampaignOption.PAID_WITH_LL:
            onboardingBuckets['Paid with LL'] += 1;
            onboardingRows['Paid with LL'].push({
              name: this.getCustomerName(ticket),
              phone: this.getCustomerPhone(ticket),
              status: 'Paid with LL',
              note: ticket.issueDetail || '',
            });
            break;
          default:
            onboardingBuckets.Unknown += 1;
            onboardingRows.Unknown.push({
              name: this.getCustomerName(ticket),
              phone: this.getCustomerPhone(ticket),
              status: 'Unknown',
              note: ticket.issueDetail || '',
            });
            break;
        }
      }
    });

    const statusBreakdown = isAr
      ? Object.entries(arBuckets).map(([name, value]) => ({ name, value }))
      : Object.entries(onboardingBuckets).map(([name, value]) => ({
          name,
          value,
        }));

    const baseColor = '#1e40af';
    const metrics = isAr
      ? [
          { title: 'Total Tickets', value: tickets.length, color: baseColor },
          { title: 'Paid', value: arBuckets.Paid, color: '#16a34a' },
          { title: 'Not Paid', value: arBuckets['Not Paid'], color: '#dc2626' },
          {
            title: 'Offline Payment',
            value: arBuckets['Offline Payment'],
            color: '#f59e0b',
          },
          {
            title: 'Not Paid Check',
            value: arBuckets['Not Paid Check'],
            color: '#d97706',
          },
          {
            title: 'Moved Out',
            value: arBuckets['Moved Out'],
            color: '#ea580c',
          },
          { title: 'Canceled', value: arBuckets.Canceled, color: '#ef4444' },
          {
            title: 'Balance 0',
            value: arBuckets['Balance 0'],
            color: '#0891b2',
          },
          {
            title: 'Do Not Call',
            value: arBuckets['Do Not Call'],
            color: '#b91c1c',
          },
          { title: 'Missed Calls', value: missed, color: '#b91c1c' },
        ]
      : [
          { title: 'Total Tickets', value: tickets.length, color: baseColor },
          {
            title: 'Registered',
            value: onboardingBuckets.Registered,
            color: '#16a34a',
          },
          {
            title: 'Not Registered',
            value: onboardingBuckets['Not Registered'],
            color: '#f59e0b',
          },
          {
            title: 'Paid with LL',
            value: onboardingBuckets['Paid with LL'],
            color: '#0ea5e9',
          },
          { title: 'Missed Calls', value: missed, color: '#b91c1c' },
        ];

    return {
      campaign: {
        id: campaign.id,
        nombre: campaign.nombre,
        yardaName: campaign.yarda?.name || null,
        tipo: campaign.tipo,
      },
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      statusBreakdown,
      metrics,
      totals: {
        total: tickets.length,
        missed,
      },
      isAr,
      tables: isAr
        ? Object.keys(arBuckets).map((key) => ({
            title: key,
            rows: arRows[key] || [],
          }))
        : Object.keys(onboardingBuckets).map((key) => ({
            title: key,
            rows: onboardingRows[key] || [],
          })),
    };
  }

  async getCampaignReportPdf(
    campaignId: number,
    startDate: string,
    endDate: string,
    logoUrl?: string,
  ) {
    const report = await this.buildCampaignReportData(
      campaignId,
      startDate,
      endDate,
    );
    const logoBuffer = await this.loadLogoBuffer(logoUrl);
    return this.buildCampaignReportPdf(report, logoBuffer);
  }

  async create(createCampaignDto: CreateCampaignDto) {
    const name = createCampaignDto.nombre?.trim();
    if (name) {
      const existing = await this.campaignRepo.findOne({
        where: { nombre: ILike(name) },
      });
      if (existing) {
        throw new ConflictException(
          'A campaign with this name already exists. Please choose a different name.',
        );
      }
    }
    let yard: Yard | null = null;
    if (createCampaignDto.yardaId !== undefined) {
      yard = await this.yardRepo.findOneBy({
        id: createCampaignDto.yardaId,
      });

      if (!yard) {
        throw new NotFoundException(
          `Yard with ID ${createCampaignDto.yardaId} not found`,
        );
      }
    }

    const campaign = this.campaignRepo.create({
      ...createCampaignDto,
      yarda: yard ?? undefined,
    });
    return this.campaignRepo.save(campaign);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await this.campaignRepo.findAndCount({
      relations: ['yarda'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const counts = await this.getTicketCounts(campaigns);
    const data = campaigns.map((campaign) => ({
      ...campaign,
      ticketCount: counts.get(campaign.id) || 0,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ['yarda'],
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const ticketCount = await this.ticketRepo.count({
      where: {
        campaignId: campaign.id,
      },
    });

    return {
      ...campaign,
      ticketCount,
    };
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    if (updateCampaignDto.yardaId !== undefined) {
      const yard = await this.yardRepo.findOneBy({
        id: updateCampaignDto.yardaId,
      });

      if (!yard) {
        throw new NotFoundException(
          `Yard with ID ${updateCampaignDto.yardaId} not found`,
        );
      }

      campaign.yarda = yard;
    }

    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepo.save(campaign);
  }

  async remove(id: number) {
    const campaign = await this.findOne(id);
    const ticketCount = await this.ticketRepo.count({
      where: { campaignId: campaign.id },
    });
    if (ticketCount > 0) {
      throw new ConflictException(
        'Cannot delete campaign because it has associated tickets. Please deactivate the campaign instead.',
      );
    }
    await this.campaignRepo.remove(campaign);

    return { message: `Campaign with ID ${id} has been removed` };
  }

  findByType(tipo: string) {
    return this.campaignRepo
      .find({
        where: { tipo: tipo as any },
        relations: ['yarda'],
        order: { nombre: 'ASC' },
      })
      .then(async (campaigns) => {
        const counts = await this.getTicketCounts(campaigns);
        return campaigns.map((campaign) => ({
          ...campaign,
          ticketCount: counts.get(campaign.id) || 0,
        }));
      });
  }

  findActive() {
    return this.campaignRepo
      .find({
        where: { isActive: true },
        relations: ['yarda'],
        order: { nombre: 'ASC' },
      })
      .then(async (campaigns) => {
        const counts = await this.getTicketCounts(campaigns);
        return campaigns.map((campaign) => ({
          ...campaign,
          ticketCount: counts.get(campaign.id) || 0,
        }));
      });
  }
}
