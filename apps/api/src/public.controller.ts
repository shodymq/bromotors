import { BadRequestException, Body, Controller, Get, Param, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { CarQueryDto, LeadDto, LeadType } from './dto';
import { carOrder, carWhere, cleanText, publicCarInclude } from './helpers';

@Controller()
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    const db = this.prisma.isConnected() ? 'ok' : 'down';
    return { ok: true, db };
  }

  @Get('ready')
  async ready() {
    const ok = await (this.prisma as any).ping?.() ?? false;
    if (!ok) throw new ServiceUnavailableException('DB unavailable');
    return { ok: true, db: 'ok' };
  }

  @Get('cars')
  async cars(@Query() query: CarQueryDto) {
    return this.prisma.car.findMany({
      where: carWhere(query),
      orderBy: carOrder(query.sort),
      include: publicCarInclude(),
    });
  }

  @Get('cars/:slug')
  async car(@Param('slug') slug: string) {
    const car = await this.prisma.car.findFirst({
      where: { slug, isPublished: true },
      include: publicCarInclude(),
    });
    if (!car) return null;
    const similar = await this.prisma.car.findMany({
      where: {
        id: { not: car.id },
        isPublished: true,
        OR: [
          { brandId: car.brandId },
          { price: { gte: Math.max(0, car.price - 2_000_000), lte: car.price + 2_000_000 } },
        ],
      },
      include: publicCarInclude(),
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    return { ...car, similar };
  }

  @Get('brands')
  async brands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { models: { orderBy: { name: 'asc' } } } });
  }

  @Get('models')
  async models(@Query('brandId') brandId?: string) {
    return this.prisma.model.findMany({ where: brandId ? { brandId } : {}, orderBy: { name: 'asc' }, include: { brand: true } });
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('leads')
  lead(@Body() dto: LeadDto) {
    return this.createLead(LeadType.question, dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('leads/trade-in')
  tradeIn(@Body() dto: LeadDto) {
    return this.createLead(LeadType.trade_in, dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('leads/question')
  question(@Body() dto: LeadDto) {
    return this.createLead(LeadType.question, dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('leads/credit')
  credit(@Body() dto: LeadDto) {
    return this.createLead(LeadType.credit, dto);
  }

  private async createLead(type: LeadType, dto: LeadDto) {
    const name = cleanText(dto.name);
    const phone = cleanText(dto.phone);
    if (!name || !phone) {
      throw new BadRequestException('Имя и телефон обязательны');
    }
    const lead = await this.prisma.lead.create({
      data: {
        type,
        carId: cleanText(dto.carId),
        name,
        phone,
        message: cleanText(dto.message),
        payload: (dto.payload || undefined) as never,
      },
    });
    return { ok: true, id: lead.id };
  }
}
