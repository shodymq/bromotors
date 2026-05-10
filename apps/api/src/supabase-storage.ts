import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

let cachedClient: SupabaseClient | null = null;

export function storageStatus() {
  return isStorageConfigured() ? 'configured' : 'not_configured';
}

export function isStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && storageBucket());
}

export function storageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'car-images';
}

function supabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ServiceUnavailableException('Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the API.');
  }
  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

function safeStoragePath(path: string) {
  const value = path.trim().replace(/^\/+/, '');
  if (!value.startsWith('cars/') || value.includes('..') || /[\0\\]/.test(value)) {
    throw new BadRequestException('Invalid storage path');
  }
  return value;
}

function pathPrefix(carId?: string) {
  const safeCarId = carId?.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return safeCarId ? `cars/${safeCarId}` : 'cars/tmp';
}

export async function uploadCarImageToStorage(file: Express.Multer.File, carId?: string) {
  const ext = ALLOWED_IMAGE_TYPES.get(file.mimetype);
  if (!ext) throw new BadRequestException('Only JPEG, PNG and WEBP images are allowed');
  const objectPath = `${pathPrefix(carId)}/${Date.now()}-${randomUUID()}.${ext}`;
  const bucket = storageBucket();
  const { error } = await supabaseClient()
    .storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) throw new ServiceUnavailableException(`Supabase upload failed: ${error.message}`);
  const { data } = supabaseClient().storage.from(bucket).getPublicUrl(objectPath);
  return { path: objectPath, url: data.publicUrl };
}

export async function removeCarImageFromStorage(path: string) {
  const objectPath = safeStoragePath(path);
  const { data, error } = await supabaseClient().storage.from(storageBucket()).remove([objectPath]);
  if (error) return { ok: false, path: objectPath, message: error.message };
  return { ok: true, path: objectPath, removed: data };
}

export function storagePathFromPublicUrl(url: string) {
  const bucket = storageBucket();
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

