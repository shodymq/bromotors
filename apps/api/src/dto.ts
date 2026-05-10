import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsJSON,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { CarStatus, LeadStatus, LeadType } from '@bromotors/db';

export class CarQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @Type(() => Number) @IsInt() yearFrom?: number;
  @IsOptional() @Type(() => Number) @IsInt() yearTo?: number;
  @IsOptional() @Type(() => Number) @IsInt() priceFrom?: number;
  @IsOptional() @Type(() => Number) @IsInt() priceTo?: number;
  @IsOptional() @Type(() => Number) @IsInt() mileageFrom?: number;
  @IsOptional() @Type(() => Number) @IsInt() mileageTo?: number;
  @IsOptional() @IsString() bodyType?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsString() transmission?: string;
  @IsOptional() @IsEnum(CarStatus) status?: CarStatus;
  @IsOptional() @IsString() sort?: 'newest' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc';
}

export class LoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() email!: string;
  @IsString() @Length(8, 160) password!: string;
}

export class BrandDto {
  @IsString() @Length(1, 80) name!: string;
}

export class ModelDto {
  @IsString() brandId!: string;
  @IsString() @Length(1, 80) name!: string;
}

export class CarDto {
  @IsString() brandId!: string;
  @IsString() modelId!: string;
  @IsString() @Length(2, 140) title!: string;
  @Type(() => Number) @IsInt() @Min(1950) @Max(2100) year!: number;
  @Type(() => Number) @IsInt() @Min(0) price!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) mileage?: number;
  @IsString() @Length(1, 20) engineVolume!: string;
  @IsOptional() @IsString() @Length(0, 60) bodyType?: string;
  @IsOptional() @IsString() @Length(0, 60) fuelType?: string;
  @IsOptional() @IsString() @Length(0, 60) transmission?: string;
  @IsOptional() @IsString() @Length(0, 60) driveType?: string;
  @IsOptional() @IsString() @Length(0, 60) color?: string;
  @IsString() @Length(10, 2000) description!: string;
  @IsEnum(CarStatus) status!: CarStatus;
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === true || value === 'true') isNewArrival?: boolean;
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === true || value === 'true') isDiscount?: boolean;
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === true || value === 'true') isPublished?: boolean;
}

export class CreditSettingDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100) rate!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(90) minDownPercent!: number;
  @Type(() => Number) @IsInt() @Min(3) @Max(360) maxMonths!: number;
}

export class LeadDto {
  @IsOptional() @IsString() carId?: string;
  @IsString() @Length(2, 80) name!: string;
  @IsPhoneNumber('KZ') phone!: string;
  @IsOptional() @IsString() @Length(0, 1200) message?: string;
  @IsOptional() payload?: Record<string, unknown>;
}

export class StatusDto {
  @IsEnum(LeadStatus) status!: LeadStatus;
}

export class ReorderDto {
  @IsJSON() order!: string;
}

export { CarStatus, LeadStatus, LeadType };
