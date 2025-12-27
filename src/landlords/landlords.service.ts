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
        name: yard.commonName || yard.name,
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
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    doc.fontSize(18).text('Landlord Report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Landlord: ${report.landlord.name}`);
    doc.text(`Range: ${new Date(report.range.startDate).toLocaleDateString()} - ${new Date(
      report.range.endDate,
    ).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(12).text('Summary');
    doc.fontSize(10).text(`Total Tickets: ${report.totals.total}`);
    doc.text(`Inbound Calls: ${report.totals.inbound}`);
    doc.text(`Outbound Calls: ${report.totals.outbound}`);
    doc.text(`Average per Yard: ${report.averagePerYard}`);
    doc.moveDown();

    doc.fontSize(12).text('Yards');
    doc.moveDown(0.5);
    report.yards.forEach((yard: any) => {
      doc.fontSize(10).text(
        `${yard.name} | Total: ${yard.total} | Inbound: ${yard.inbound} | Outbound: ${yard.outbound}`,
      );
    });
    doc.moveDown();

    doc.fontSize(12).text('Top Yards');
    doc.moveDown(0.5);
    report.topYards.forEach((yard: any) => {
      doc.fontSize(10).text(`${yard.name} | Total: ${yard.total}`);
    });
    doc.moveDown();

    doc.fontSize(12).text('Calls by Day');
    doc.moveDown(0.5);
    report.callsByDay.forEach((day: any) => {
      doc.fontSize(10).text(
        `${day.date} | Total: ${day.total} | Inbound: ${day.inbound} | Outbound: ${day.outbound}`,
      );
    });
    doc.moveDown();

    const chartDays = report.callsByDay.slice(-14);
    const maxTotal = Math.max(0, ...chartDays.map((day: any) => day.total));
    const chartX = doc.x;
    const chartStartY = doc.y;
    const barHeight = 8;
    const barGap = 6;
    const maxBarWidth = 200;

    doc.fontSize(12).text('Daily Volume (last 14 days)');
    chartDays.forEach((day: any, index: number) => {
      const y = chartStartY + 20 + index * (barHeight + barGap);
      const width = maxTotal ? (day.total / maxTotal) * maxBarWidth : 0;
      doc.fillColor('black').fontSize(8).text(day.date, chartX, y);
      doc.rect(chartX + 70, y + 2, width, barHeight).fill('#4f46e5');
      doc.fillColor('black')
        .fontSize(8)
        .text(String(day.total), chartX + 70 + maxBarWidth + 6, y);
    });
    doc.y = chartStartY + 20 + chartDays.length * (barHeight + barGap) + 10;

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
