import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

const WINDOW_MS = 60_000; // 1 min
const MINUTE_LIMIT = 10; // Conservative limit: 10 req/min (vs 15 free quota limit)
const DAILY_LIMIT = 180; // Conservative limit: 180 req/day (vs 200 free quota limit)
const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Rate-limit to protect your free quota - limits request frequency to avoid exceeding free quota
  private hits = new Map<string, number[]>(); // Minute-based tracking
  private dailyHits = new Map<string, number[]>(); // Daily tracking

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip: string = (req.ip || req.socket?.remoteAddress || 'unknown') as string;

    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const dayStart = now - DAY_MS;

    // Check minute-based limit
    const minuteTimes = (this.hits.get(ip) || []).filter((t) => t > windowStart);
    minuteTimes.push(now);
    this.hits.set(ip, minuteTimes);

    // Check daily limit
    const dailyTimes = (this.dailyHits.get(ip) || []).filter((t) => t > dayStart);
    dailyTimes.push(now);
    this.dailyHits.set(ip, dailyTimes);

    if (minuteTimes.length > MINUTE_LIMIT) {
      throw new BadRequestException('Rate limit exceeded (10 requests per minute), please try again later');
    }

    if (dailyTimes.length > DAILY_LIMIT) {
      throw new BadRequestException('Daily limit exceeded (180 requests per day), please try again tomorrow');
    }

    return true;
    }
}