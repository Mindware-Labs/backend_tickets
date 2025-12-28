import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLandlordDto } from './dto/create-landlord.dto';
import { UpdateLandlordDto } from './dto/update-landlord.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Yard } from '../yards/entities/yard.entity';
import { In, Repository } from 'typeorm';
import { Landlord } from './entities/landlord.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { EmailService } from '../email/email.service';
import { landlordReportTemplate } from '../email/templates/email.templates';
import PDFDocument from 'pdfkit';

@Injectable()
export class LandlordsService {
  @InjectRepository(Yard)
  private readonly yardRepository: Repository<Yard>;

  @InjectRepository(Landlord)
  private readonly landlordRepository: Repository<Landlord>;

  @InjectRepository(Ticket)
  private readonly ticketRepository: Repository<Ticket>;

  constructor(private readonly emailService: EmailService) {}

  private async assignYards(landlord: Landlord, yardIds?: number[]) {
    if (!yardIds) return;
    const uniqueYardIds = Array.from(new Set(yardIds));

    const yards = await this.yardRepository.findBy({
      id: In(uniqueYardIds),
    });
    if (yards.length !== uniqueYardIds.length) {
      throw new NotFoundException('One or more yards not found');
    }

    const currentYards = await this.yardRepository.find({
      where: { landlord: { id: landlord.id } },
    });

    const yardIdSet = new Set(uniqueYardIds);
    const toClear = currentYards.filter((yard) => !yardIdSet.has(yard.id));
    toClear.forEach((yard) => {
      yard.landlord = null;
      yard.landlordId = null;
    });

    yards.forEach((yard) => {
      yard.landlord = landlord;
      yard.landlordId = landlord.id;
    });

    await this.yardRepository.save([...toClear, ...yards]);
  }

  async create(createLandlordDto: CreateLandlordDto) {
    const landlord = await this.landlordRepository.save({
      name: createLandlordDto.name,
      phone: createLandlordDto.phone,
      email: createLandlordDto.email,
    });

    await this.assignYards(landlord, createLandlordDto.yardIds);
    return this.findOne(landlord.id);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [landlords, total] = await this.landlordRepository.findAndCount({
      order: { id: 'DESC' },
      skip,
      take: limit,
      relations: ['yards'],
    });

    return {
      data: landlords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const landlord = await this.landlordRepository.findOne({
      where: { id },
      relations: ['yards'],
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord with id ${id} not found`);
    }
    return landlord;
  }

  async update(id: number, updateLandlordDto: UpdateLandlordDto) {
    const landlord = await this.findOne(id);

    const { yardIds, ...landlordData } = updateLandlordDto;
    Object.assign(landlord, landlordData);
    await this.landlordRepository.save(landlord);
    await this.assignYards(landlord, yardIds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const landlord = await this.findOne(id);
    await this.yardRepository.update(
      { landlord: { id: landlord.id } },
      { landlord: null, landlordId: null },
    );
    await this.landlordRepository.remove(landlord);
    return `Landlord with id ${id} has been removed`;
  }

  private normalizeDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async buildReportData(
    landlordId: number,
    startDate: string,
    endDate: string,
    yardId?: number,
  ) {
    const landlord = await this.landlordRepository.findOne({
      where: { id: landlordId },
      relations: ['yards'],
    });
    if (!landlord) {
      throw new NotFoundException(`Landlord with id ${landlordId} not found`);
    }

    const yardIds = landlord.yards?.map((yard) => yard.id) || [];
    if (yardIds.length === 0) {
      throw new NotFoundException('No yards linked to this landlord');
    }

    const targetYardIds = yardId ? [yardId] : yardIds;
    if (yardId && !yardIds.includes(yardId)) {
      throw new BadRequestException('Yard does not belong to this landlord');
    }

    const { start, end } = this.normalizeDateRange(startDate, endDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    if (diffDays > 366) {
      throw new BadRequestException('Date range is too large');
    }

    const directionRows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.yardId', 'yardId')
      .addSelect('ticket.direction', 'direction')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.yardId IN (:...yardIds)', { yardIds: targetYardIds })
      .andWhere('ticket.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('ticket.yardId')
      .addGroupBy('ticket.direction')
      .getRawMany<{ yardId: number; direction: string; count: string }>();

    const dailyRows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select("date_trunc('day', ticket.createdAt)", 'day')
      .addSelect(
        "SUM(CASE WHEN ticket.direction = 'INBOUND' THEN 1 ELSE 0 END)",
        'inbound',
      )
      .addSelect(
        "SUM(CASE WHEN ticket.direction = 'OUTBOUND' THEN 1 ELSE 0 END)",
        'outbound',
      )
      .addSelect('COUNT(ticket.id)', 'total')
      .where('ticket.yardId IN (:...yardIds)', { yardIds: targetYardIds })
      .andWhere('ticket.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{
        day: string;
        inbound: string;
        outbound: string;
        total: string;
      }>();

    const statusRows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.yardId IN (:...yardIds)', { yardIds: targetYardIds })
      .andWhere('ticket.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('ticket.status')
      .getRawMany<{ status: string; count: string }>();

    const yardMap = new Map<number, { inbound: number; outbound: number }>();
    directionRows.forEach((row) => {
      const entry = yardMap.get(row.yardId) || { inbound: 0, outbound: 0 };
      if ((row.direction || '').toUpperCase() === 'INBOUND') {
        entry.inbound += Number(row.count);
      } else if ((row.direction || '').toUpperCase() === 'OUTBOUND') {
        entry.outbound += Number(row.count);
      }
      yardMap.set(row.yardId, entry);
    });

    const yardDetails = landlord.yards?.filter((yard) =>
      targetYardIds.includes(yard.id),
    );

    const yardRows = (yardDetails || []).map((yard) => {
      const counts = yardMap.get(yard.id) || { inbound: 0, outbound: 0 };
      const total = counts.inbound + counts.outbound;
      return {
        id: yard.id,
        name: yard.name,
        inbound: counts.inbound,
        outbound: counts.outbound,
        total,
      };
    });

    const totals = yardRows.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.inbound += row.inbound;
        acc.outbound += row.outbound;
        return acc;
      },
      { total: 0, inbound: 0, outbound: 0 },
    );

    const statusBreakdown = statusRows.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status || 'UNSPECIFIED'] = Number(row.count);
        return acc;
      },
      {},
    );

    const dailyMap = new Map<string, { inbound: number; outbound: number; total: number }>();
    dailyRows.forEach((row) => {
      const key = new Date(row.day).toISOString().slice(0, 10);
      dailyMap.set(key, {
        inbound: Number(row.inbound),
        outbound: Number(row.outbound),
        total: Number(row.total),
      });
    });

    const callsByDay = Array.from({ length: diffDays }).map((_, index) => {
      const date = new Date(start.getTime() + index * msPerDay);
      const key = date.toISOString().slice(0, 10);
      const counts = dailyMap.get(key) || { inbound: 0, outbound: 0, total: 0 };
      return {
        date: key,
        inbound: counts.inbound,
        outbound: counts.outbound,
        total: counts.total,
      };
    });

    const topYards = [...yardRows]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const averagePerYard =
      yardRows.length === 0 ? 0 : Number((totals.total / yardRows.length).toFixed(2));

    return {
      landlord: {
        id: landlord.id,
        name: landlord.name,
        email: landlord.email,
      },
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      yardId: yardId || null,
      totals,
      averagePerYard,
      topYards,
      statusBreakdown,
      callsByDay,
      yards: yardRows,
    };
  }

 private async buildReportPdf(report: any) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    // Colors & Styles
    const primaryColor = '#1e40af'; // Dark Blue
    const secondaryColor = '#3b82f6'; // Bright Blue
    const grayColor = '#6b7280';
    const lightGray = '#f3f4f6';
    const white = '#ffffff';

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    // --- 1. HEADER ---
    // Header Background
    doc.rect(0, 0, doc.page.width, 140).fill(lightGray);

    // Main Title
    doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('LANDLORD REPORT', 50, 40);

    // Decorative Line
    doc.rect(50, 70, 50, 3).fill(secondaryColor);

    // Landlord Info (Left Side)
    doc.fillColor('black').fontSize(10).font('Helvetica-Bold').text('GENERATED FOR:', 50, 90);
    doc.font('Helvetica').fontSize(12).text(report.landlord.name, 50, 105);
    doc.fontSize(10).fillColor(grayColor).text(report.landlord.email, 50, 120);

    // Date Range (Right Side)
    const dateTextX = 400;
    doc.fillColor('black').fontSize(10).font('Helvetica-Bold').text('REPORT RANGE:', dateTextX, 90);
    doc.font('Helvetica').fontSize(10).text(
      `${new Date(report.range.startDate).toLocaleDateString()} - ${new Date(report.range.endDate).toLocaleDateString()}`,
      dateTextX,
      105
    );

    doc.moveDown(4); // Space after header

    // --- 2. SUMMARY CARDS (METRICS) ---
    const summaryY = 160;
    const boxWidth = 120;
    const boxHeight = 70;
    const gap = 15;

    const drawSummaryCard = (x: number, title: string, value: string | number, color: string) => {
      // Light shadow
      doc.rect(x + 2, summaryY + 2, boxWidth, boxHeight).fillColor('#e5e7eb').fill();
      // White box
      doc.rect(x, summaryY, boxWidth, boxHeight).fillColor(white).fill();
      doc.rect(x, summaryY, boxWidth, boxHeight).strokeColor('#e5e7eb').stroke();
      
      // Top color border
      doc.rect(x, summaryY, boxWidth, 3).fillColor(color).fill();

      // Text
      doc.fillColor(grayColor).fontSize(9).font('Helvetica').text(title.toUpperCase(), x + 10, summaryY + 15);
      doc.fillColor('black').fontSize(18).font('Helvetica-Bold').text(String(value), x + 10, summaryY + 35);
    };

    drawSummaryCard(50, 'Total Tickets', report.totals.total, primaryColor);
    drawSummaryCard(50 + boxWidth + gap, 'Inbound Calls', report.totals.inbound, '#10b981'); // Green
    drawSummaryCard(50 + (boxWidth + gap) * 2, 'Outbound Calls', report.totals.outbound, '#f59e0b'); // Orange
    drawSummaryCard(50 + (boxWidth + gap) * 3, 'Avg Per Yard', report.averagePerYard, secondaryColor);

    doc.y = summaryY + boxHeight + 40;

    // --- 3. YARDS TABLE (DETAILS) ---
    
    // Helper function to draw tables
    const drawTable = (title: string, data: any[], columns: { header: string, width: number, key: string, align?: string }[]) => {
      // Check for page break
      if (doc.y + 100 > doc.page.height) doc.addPage();

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(title, 50, doc.y);
      doc.moveDown(0.5);

      const startX = 50;
      let currentY = doc.y;
      const rowHeight = 25;

      // Draw Headers
      doc.rect(startX, currentY, 500, rowHeight).fill(lightGray);
      let colX = startX + 10;
      
      doc.fillColor('black').fontSize(9).font('Helvetica-Bold');
      columns.forEach(col => {
        doc.text(col.header, colX, currentY + 8, { width: col.width, align: col.align as any || 'left' });
        colX += col.width;
      });

      currentY += rowHeight;

      // Draw Rows
      doc.font('Helvetica').fontSize(9);
      data.forEach((row, index) => {
        // Check for page break inside table
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        // Alternating row colors (zebra striping)
        if (index % 2 === 0) {
           doc.rect(startX, currentY, 500, rowHeight).fill('#fafafa');
        }
        
        // Subtle bottom border
        doc.moveTo(startX, currentY + rowHeight).lineTo(startX + 500, currentY + rowHeight).strokeColor('#e5e7eb').stroke();

        let cellX = startX + 10;
        doc.fillColor('#374151'); // Dark gray text
        
        columns.forEach(col => {
            const textValue = String(row[col.key] || 0);
            doc.text(textValue, cellX, currentY + 8, { width: col.width, align: col.align as any || 'left' });
            cellX += col.width;
        });

        currentY += rowHeight;
      });

      doc.y = currentY + 30; // Space after table
    };

    // Column definitions
    const yardColumns = [
        { header: 'YARD NAME', width: 200, key: 'name' },
        { header: 'TOTAL', width: 80, key: 'total', align: 'center' },
        { header: 'INBOUND', width: 80, key: 'inbound', align: 'center' },
        { header: 'OUTBOUND', width: 80, key: 'outbound', align: 'center' }
    ];

    // Draw Yards Table (Sorted by total volume)
    const sortedYards = [...report.yards].sort((a: any, b: any) => b.total - a.total);
    drawTable('Yard Details', sortedYards, yardColumns);


    // --- 4. BAR CHART (Daily Volume) ---
    
    // Check space for chart
    if (doc.y + 200 > doc.page.height) doc.addPage();

    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Daily Volume', 50, doc.y);
    doc.moveDown(1);

    const chartDays = report.callsByDay.slice(-14);
    const maxTotal = Math.max(1, ...chartDays.map((day: any) => day.total)); // Prevent division by zero
    
    const chartX = 50;
    const chartWidth = 450;
    const barHeight = 15;
    const barGap = 10;
    const labelWidth = 60;
    const maxBarWidth = chartWidth - labelWidth - 40; // Space for value label

    let chartY = doc.y;

    doc.font('Helvetica').fontSize(8);

    chartDays.forEach((day: any) => {
      // Check page break inside chart
      if (chartY + barHeight + barGap > doc.page.height - 50) {
         doc.addPage();
         chartY = 50;
      }

      // Date Label
      doc.fillColor(grayColor).text(day.date, chartX, chartY + 4, { width: labelWidth, align: 'right' });

      // Bar Background (light gray for context)
      doc.rect(chartX + labelWidth + 10, chartY, maxBarWidth, barHeight).fillColor('#f3f4f6').fill();

      // Value Bar
      const width = (day.total / maxTotal) * maxBarWidth;
      if (width > 0) {
        doc.rect(chartX + labelWidth + 10, chartY, width, barHeight).fillColor(secondaryColor).fill();
      }

      // Value Label
      doc.fillColor('black').text(String(day.total), chartX + labelWidth + 10 + width + 5, chartY + 4);

      chartY += barHeight + barGap;
    });

    doc.end();

    return await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  async getReport(
    landlordId: number,
    startDate: string,
    endDate: string,
    yardId?: number,
  ) {
    return this.buildReportData(landlordId, startDate, endDate, yardId);
  }

  async sendReport(
    landlordId: number,
    startDate: string,
    endDate: string,
    yardId?: number,
  ) {
    const report = await this.buildReportData(
      landlordId,
      startDate,
      endDate,
      yardId,
    );
    const pdf = await this.buildReportPdf(report);
    const html = landlordReportTemplate(
      report.landlord.name,
      new Date(report.range.startDate).toLocaleDateString(),
      new Date(report.range.endDate).toLocaleDateString(),
      report.totals.total,
      report.totals.inbound,
      report.totals.outbound,
      report.averagePerYard,
      report.topYards,
      report.callsByDay,
      report.yards,
    );

    await this.emailService.sendLandlordReportEmail(
      report.landlord.email,
      `Landlord Report - ${report.landlord.name}`,
      html,
      pdf,
    );

    return { success: true };
  }
}
