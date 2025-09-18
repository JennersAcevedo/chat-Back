import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

const WINDOW_MS = 60_000; // 1 min
const LIMIT = 5;

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Guard to limit the number of requests per IP
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
      throw new BadRequestException('Rate limit exceeded, please try again later');
    }
    return true;
    }
}