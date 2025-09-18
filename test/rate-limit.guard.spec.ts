import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { RateLimitGuard } from '../src/shared/guards/rate-limit.guard';

describe('RateLimitGuard', () => {
  // Unit tests para RateLimitGuard
  let guard: RateLimitGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitGuard],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    
    // Reiniciar el mapa de hits antes de cada test
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

    it('debería permitir request cuando está bajo el límite de rate', () => {
      // Actuar
      const result = guard.canActivate(mockExecutionContext);

      // Verificar
      expect(result).toBe(true);
    });

    it('debería permitir múltiples requests bajo el límite', () => {
      // Actuar y Verificar
      for (let i = 0; i < 5; i++) {
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      }
    });

    it('debería lanzar BadRequestException cuando se excede el límite de rate', () => {
      // Preparar - Hacer 5 requests primero (el límite)
      for (let i = 0; i < 5; i++) {
        guard.canActivate(mockExecutionContext);
      }

      // Actuar y Verificar
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        BadRequestException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Limite excedido, intente mas tarde'
      );
    });

    it('debería usar dirección IP de request.ip cuando esté disponible', () => {
      // Preparar
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

      // Actuar
      guard.canActivate(mockExecutionContext);

      // Verificar
      const hits = (guard as any).hits;
      expect(hits.has('10.0.0.1')).toBe(true);
      expect(hits.has('192.168.1.1')).toBe(false);
    });

    it('debería usar socket.remoteAddress cuando request.ip no esté disponible', () => {
      // Preparar
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

      // Actuar
      guard.canActivate(mockExecutionContext);

      // Verificar
      const hits = (guard as any).hits;
      expect(hits.has('192.168.1.100')).toBe(true);
    });

    it('debería usar "unknown" cuando ni IP ni dirección socket estén disponibles', () => {
      // Preparar
      const mockRequest = {};
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Actuar
      guard.canActivate(mockExecutionContext);

      // Verificar
      const hits = (guard as any).hits;
      expect(hits.has('unknown')).toBe(true);
    });

    it('debería rastrear diferentes IPs por separado', () => {
      // Preparar
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

      // Actuar - Hacer 5 requests desde IP1 (debería estar bien)
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockExecutionContext1)).toBe(true);
      }

      // Hacer 5 requests desde IP2 (también debería estar bien)
      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(mockExecutionContext2)).toBe(true);
      }

      // Verificar - Ambas IPs deberían ser rastreadas por separado
      const hits = (guard as any).hits;
      expect(hits.get(ip1)).toHaveLength(5);
      expect(hits.get(ip2)).toHaveLength(5);
    });

    it('debería limpiar timestamps antiguos fuera de la ventana', () => {
      // Preparar
      const now = Date.now();
      const oldTimestamp = now - 70000; // hace 70 segundos (fuera de ventana de 60s)
      const recentTimestamp = now - 30000; // hace 30 segundos (dentro de ventana de 60s)

      // Agregar manualmente timestamps antiguos al mapa de hits
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp, recentTimestamp]);

      // Mockear Date.now para retornar tiempo actual
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Actuar
      guard.canActivate(mockExecutionContext);

      // Verificar
      const ipHits = hits.get('192.168.1.1');
      expect(ipHits).toHaveLength(2); // Solo timestamp reciente + nuevo
      expect(ipHits).not.toContain(oldTimestamp);
      expect(ipHits).toContain(recentTimestamp);

      // Restaurar Date.now
      jest.restoreAllMocks();
    });

    it('debería permitir requests nuevamente después de que expire la ventana', () => {
      // Preparar
      const now = Date.now();
      const oldTimestamp = now - 70000; // hace 70 segundos

      // Agregar manualmente timestamps antiguos al mapa de hits
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp]);

      // Mockear Date.now para retornar tiempo actual
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Actuar - Debería ser permitido porque timestamp antiguo está fuera de ventana
      const result = guard.canActivate(mockExecutionContext);

      // Verificar
      expect(result).toBe(true);

      // Restaurar Date.now
      jest.restoreAllMocks();
    });

    it('debería manejar requests concurrentes correctamente', async () => {
      // Preparar
      const promises: Promise<boolean>[] = [];

      // Actuar - Hacer 5 requests concurrentes
      for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve(guard.canActivate(mockExecutionContext)));
      }

      // Verificar - Todos deberían ser permitidos
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('debería mantener conteo correcto después de limpieza', () => {
      // Preparar
      const now = Date.now();
      const oldTimestamp = now - 70000; // hace 70 segundos
      const recentTimestamp = now - 30000; // hace 30 segundos

      // Agregar manualmente timestamps mixtos
      const hits = (guard as any).hits;
      hits.set('192.168.1.1', [oldTimestamp, recentTimestamp, recentTimestamp]);

      // Mockear Date.now
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Actuar
      guard.canActivate(mockExecutionContext);

      // Verificar
      const ipHits = hits.get('192.168.1.1');
      expect(ipHits).toHaveLength(3); // 2 recientes + 1 nuevo
      expect(ipHits.filter(t => t === oldTimestamp)).toHaveLength(0);

      // Restaurar Date.now
      jest.restoreAllMocks();
    });
  });
});
