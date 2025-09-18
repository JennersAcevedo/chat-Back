import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

const WINDOW_MS = 60_000; // 1 min
const LIMIT = 5;

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Guard para limitar la cantidad de requests por IP
  private hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip: string = (req.ip || req.socket?.remoteAddress || 'unknown') as string;

    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const times = (this.hits.get(ip) || []).filter((t) => t > windowStart);
    times.push(now);
    this.hits.set(ip, times);

    if (times.length > LIMIT) {
      throw new BadRequestException('Limite excedido, intente mas tarde');
    }
    return true;
    }
}