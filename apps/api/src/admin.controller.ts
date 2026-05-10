import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Response, Request } from 'express';
import * as multer from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import sharp = require('sharp');
import { PrismaService } from './prisma.service';
import { BrandDto, CarDto, CreditSettingDto, LeadUpdateDto, LoginDto, ModelDto, StatusDto } from './dto';
import { publicCarInclude, slugify, cleanText } from './helpers';
import { requireJwtSecret } from './auth.guard';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || '../../apps/web/public/uploads/cars');

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post(['login', 'auth/login'])
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }, {
      secret: requireJwtSecret(),
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as never,
    });
    response.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('admin_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@Req() request: Request & { user?: { sub: string } }) {
    return this.prisma.user.findUnique({ where: { id: request.user?.sub }, select: { id: true, email: true, role: true } });
  }

  @Get('brands')
  brands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { cars: true, models: true } } } });
  }

  @Post('brands')
  createBrand(@Body() dto: BrandDto) {
    return this.prisma.brand.create({ data: { name: cleanText(dto.name)!, slug: slugify(dto.name) } });
  }

  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() dto: BrandDto) {
    return this.prisma.brand.update({ where: { id }, data: { name: cleanText(dto.name)!, slug: slugify(dto.name) } });
  }

  @Delete('brands/:id')
  async deleteBrand(@Param('id') id: string) {
    const count = await this.prisma.car.count({ where: { brandId: id } });
    if (count) throw new BadRequestException('У бренда есть авто');
    return this.prisma.brand.delete({ where: { id } });
  }

  @Get('models')
  models() {
    return this.prisma.model.findMany({ orderBy: { name: 'asc' }, include: { brand: true, _count: { select: { cars: true } } } });
  }

  @Post('models')
  createModel(@Body() dto: ModelDto) {
    return this.prisma.model.create({ data: { brandId: dto.brandId, name: cleanText(dto.name)!, slug: slugify(dto.name) } });
  }

  @Patch('models/:id')
  updateModel(@Param('id') id: string, @Body() dto: ModelDto) {
    return this.prisma.model.update({ where: { id }, data: { brandId: dto.brandId, name: cleanText(dto.name)!, slug: slugify(dto.name) } });
  }

  @Delete('models/:id')
  async deleteModel(@Param('id') id: string) {
    const count = await this.prisma.car.count({ where: { modelId: id } });
    if (count) throw new BadRequestException('У модели есть авто');
    return this.prisma.model.delete({ where: { id } });
  }

  @Get('cars')
  cars() {
    return this.prisma.car.findMany({ orderBy: { createdAt: 'desc' }, include: publicCarInclude() });
  }

  @Post('cars')
  async createCar(@Body() dto: CarDto) {
    const brand = await this.prisma.brand.findUniqueOrThrow({ where: { id: dto.brandId } });
    const model = await this.prisma.model.findUniqueOrThrow({ where: { id: dto.modelId } });
    return this.prisma.car.create({ data: this.carData(dto, `${brand.slug}-${model.slug}-${dto.year}-${Date.now().toString(36)}`) as never });
  }

  @Patch('cars/:id')
  updateCar(@Param('id') id: string, @Body() dto: CarDto) {
    return this.prisma.car.update({ where: { id }, data: this.carData(dto) });
  }

  @Delete('cars/:id')
  hideCar(@Param('id') id: string) {
    return this.prisma.car.update({ where: { id }, data: { isPublished: false } });
  }

  @Post('cars/:id/images')
  @UseInterceptors(FilesInterceptor('files', 50, {
    storage: multer.memoryStorage(),
    limits: { files: 50, fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    },
  }))
  async uploadImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    const car = await this.prisma.car.findUniqueOrThrow({ where: { id } });
    if (!files?.length) throw new BadRequestException('Нет файлов');
    const current = await this.prisma.carImage.count({ where: { carId: id } });
    if (current + files.length > 50) throw new BadRequestException('Максимум 50 фото');
    const target = path.join(uploadDir, car.slug);
    fs.mkdirSync(target, { recursive: true });
    const created = [];
    for (const [index, file] of files.entries()) {
      const meta = await sharp(file.buffer).metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new BadRequestException('Недопустимый файл');
      const name = `${Date.now()}-${index}.webp`;
      await sharp(file.buffer).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(target, name));
      created.push(await this.prisma.carImage.create({
        data: {
          carId: id,
          path: `/uploads/cars/${car.slug}/${name}`,
          alt: `${car.title} фото`,
          sortOrder: current + index,
          isCover: current === 0 && index === 0,
        },
      }));
    }
    return created;
  }

  @Patch('cars/:id/images/reorder')
  async reorder(@Param('id') id: string, @Body('order') order: string[]) {
    if (!Array.isArray(order)) throw new BadRequestException('Неверный порядок');
    await this.prisma.$transaction(order.map((imageId, sortOrder) => this.prisma.carImage.update({ where: { id: imageId, carId: id }, data: { sortOrder } })));
    return { ok: true };
  }

  @Patch('cars/:id/images/:imageId/cover')
  async cover(@Param('id') id: string, @Param('imageId') imageId: string) {
    await this.prisma.$transaction([
      this.prisma.carImage.updateMany({ where: { carId: id }, data: { isCover: false } }),
      this.prisma.carImage.update({ where: { id: imageId, carId: id }, data: { isCover: true } }),
    ]);
    return { ok: true };
  }

  @Delete('cars/:id/images/:imageId')
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const image = await this.prisma.carImage.findUniqueOrThrow({ where: { id: imageId, carId: id } });
    await this.prisma.carImage.delete({ where: { id: imageId } });
    const file = path.resolve(process.cwd(), '../../apps/web/public', image.path.replace(/^\//, ''));
    if (file.startsWith(path.resolve(process.cwd(), '../../apps/web/public/uploads/cars')) && fs.existsSync(file)) fs.unlinkSync(file);
    return { ok: true };
  }

  @Get('credit-settings')
  async getCreditSettings() {
    let setting = await this.prisma.creditSetting.findFirst();
    if (!setting) setting = await this.prisma.creditSetting.create({ data: {} });
    return setting;
  }

  @Patch('credit-settings')
  async updateCreditSettings(@Body() dto: CreditSettingDto) {
    let setting = await this.prisma.creditSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.creditSetting.create({ data: { rate: dto.rate, minDownPercent: dto.minDownPercent, maxMonths: dto.maxMonths } });
    } else {
      setting = await this.prisma.creditSetting.update({ where: { id: setting.id }, data: { rate: dto.rate, minDownPercent: dto.minDownPercent, maxMonths: dto.maxMonths } });
    }
    return setting;
  }

  @Get('leads')
  leads() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, include: { car: { include: { brand: true, model: true } } } });
  }

  @Get('leads/:id')
  lead(@Param('id') id: string) {
    return this.prisma.lead.findUnique({ where: { id }, include: { car: { include: { brand: true, model: true } } } });
  }

  @Patch('leads/:id')
  updateLead(@Param('id') id: string, @Body() dto: LeadUpdateDto) {
    const data = {
      status: dto.status,
      message: dto.message === undefined ? undefined : (cleanText(dto.message) ?? null),
      carId: dto.carId === undefined ? undefined : (cleanText(dto.carId) ?? null),
    };
    return this.prisma.lead.update({
      where: { id },
      data,
      include: { car: { include: { brand: true, model: true } } },
    });
  }

  @Patch('leads/:id/status')
  updateLeadStatus(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.prisma.lead.update({ where: { id }, data: { status: dto.status } });
  }

  @Delete('leads/:id')
  deleteLead(@Param('id') id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  private carData(dto: CarDto, slug?: string) {
    const data = {
      brandId: dto.brandId,
      modelId: dto.modelId,
      title: cleanText(dto.title)!,
      year: dto.year,
      price: dto.price,
      mileage: dto.mileage,
      engineVolume: cleanText(dto.engineVolume)!,
      bodyType: cleanText(dto.bodyType),
      fuelType: cleanText(dto.fuelType),
      transmission: cleanText(dto.transmission),
      driveType: cleanText(dto.driveType),
      color: cleanText(dto.color),
      description: cleanText(dto.description)!,
      status: dto.status,
      isNewArrival: Boolean(dto.isNewArrival),
      isDiscount: Boolean(dto.isDiscount),
      isPublished: dto.isPublished ?? true,
    };
    return slug ? { ...data, slug } : data;
  }
}
