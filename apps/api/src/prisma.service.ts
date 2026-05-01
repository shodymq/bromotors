import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@bromotors/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _connected = false;

  async onModuleInit() {
    if (process.env.VERCEL === '1') return;
    await this.tryConnect();
  }

  private async tryConnect(retries = 0) {
    try {
      await this.$connect();
      this._connected = true;
      console.info('Prisma connected');
    } catch (err) {
      this._connected = false;
      console.error('Prisma connect failed:', err);
      if (process.env.VERCEL !== '1' && retries < 5) {
        const delay = Math.min(5000 * (retries + 1), 30000);
        setTimeout(() => this.tryConnect(retries + 1), delay);
      }
    }
  }

  isConnected() {
    return this._connected;
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err) {
      console.error('Prisma disconnect failed:', err);
    }
  }
}
