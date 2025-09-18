import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { RateLimitGuard } from '../src/shared/guards/rate-limit.guard';

describe('RateLimitGuard', () => {
  // Unit tests for RateLimitGuard
  let guard: RateLimitGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitGuard],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    
    // Reset the hits map before each test
    (guard as any).hits = new Map();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            ip: '192.168.1.1',
            socket: {
              remoteAddress: '192.168.1.1',
            },
          }),
        }),
      } as any;
    });

    it('should allow request when under rate limit', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow multiple requests under the limit', () => {
      // Act and Assert
      for (let i = 0; i < 5; i++) {
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      }
    });

    it('should throw BadRequestException when rate limit is exceeded', () => {
      // Arrange - Make 5 requests first (the limit)
      for (let i = 0; i < 5; i++) {
        guard.canActivate(mockExecutionContext);
      }

      // Act and Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        BadRequestException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Rate limit exceeded, please try again later'
      );
    });

    it('should use request.ip address when available', () => {
      // Arrange
      const mockRequest = {
        ip: '10.0.0.1',
        socket: {
          remoteAddress: '192.168.1.1',
        },
      };
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      const hits = (guard as any).hits;
      expect(hits.has('10.0.0.1')).toBe(true);
      expect(hits.has('192.168.1.1')).toBe(false);
    });

    it('should use socket.remoteAddress when request.ip is not available', () => {
      // Arrange
      const mockRequest = {
        socket: {
          remoteAddress: '192.168.1.100',
        },
      };
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      const hits = (guard as any).hits;
      expect(hits.has('192.168.1.100')).toBe(true);
    });

    it('should use "unknown" when neither IP nor socket address are available', () => {
      // Arrange
      const mockRequest = {};
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      const hits = (guard as any).hits;
      expect(hits.has('unknown')).toBe(true);
    });

    it('should track different IPs separately', () => {
      // Arrange
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      
      const mockExecutionContext1 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ip: ip1 }),
        }),
      } as any;

      const mockExecutionContext2 = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ ip: ip2 }),
        }),
      } as any;

      // Act - Make 5 requests from IP1 (should be fine)
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockExecutionContext1)).toBe(true);
      }

      // Make 5 requests from IP2 (should also be fine)
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockExecutionContext2)).toBe(true);
      }

      // Assert - Both IPs should be tracked separately
      const hits = (guard as any).hits;
      expect(hits.get(ip1)).toHaveLength(5);
      expect(hits.get(ip2)).toHaveLength(5);
    });

    it('should clean old timestamps outside the window', () => {
      // Arrange
      const now = Date.now();
      const oldTimestamp = now - 70000; // 70 seconds ago (outside 60s window)
      const recentTimestamp = now - 30000; // 30 seconds ago (within 60s window)

      // Manually add old timestamps to the hits map
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp, recentTimestamp]);

      // Mock Date.now to return current time
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      const ipHits = hits.get('192.168.1.1');
      expect(ipHits).toHaveLength(2); // Only recent timestamp + new
      expect(ipHits).not.toContain(oldTimestamp);
      expect(ipHits).toContain(recentTimestamp);

      // Restore Date.now
      jest.restoreAllMocks();
    });

    it('should allow requests again after window expires', () => {
      // Arrange
      const now = Date.now();
      const oldTimestamp = now - 70000; // 70 seconds ago

      // Manually add old timestamps to the hits map
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp]);

      // Mock Date.now to return current time
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Act - Should be allowed because old timestamp is outside window
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);

      // Restore Date.now
      jest.restoreAllMocks();
    });

    it('should handle concurrent requests correctly', async () => {
      // Arrange
      const promises: Promise<boolean>[] = [];

      // Act - Make 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve(guard.canActivate(mockExecutionContext)));
      }

      // Assert - All should be allowed
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should maintain correct count after cleanup', () => {
      // Arrange
      const now = Date.now();
      const oldTimestamp = now - 70000; // 70 seconds ago
      const recentTimestamp = now - 30000; // 30 seconds ago

      // Manually add mixed timestamps
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp, recentTimestamp, recentTimestamp]);

      // Mock Date.now
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      const ipHits = hits.get('192.168.1.1');
      expect(ipHits).toHaveLength(3); // 2 recent + 1 new
      expect(ipHits.filter(t => t === oldTimestamp)).toHaveLength(0);

      // Restore Date.now
      jest.restoreAllMocks();
    });
  });
});
