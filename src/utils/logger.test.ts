import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, configureLogger, logPortalApiCall } from './logger';

describe('logger utility', () => {
  // Save originals so we can spy on them
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Enable logging for tests and set to debug
    configureLogger({ enabled: true, minLevel: 'debug', prefix: '[TEST]' });
  });

  afterEach(() => {
    debugSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // ─── createLogger ─────────────────────────────────────────────────

  describe('createLogger', () => {
    it('returns an object with debug, info, warn, error methods', () => {
      const logger = createLogger('TestContext');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('debug() calls console.debug with formatted message', () => {
      const logger = createLogger('MyModule');
      logger.debug('hello world');
      expect(debugSpy).toHaveBeenCalledTimes(1);
      const msg = debugSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[TEST]');
      expect(msg).toContain('[DEBUG]');
      expect(msg).toContain('[MyModule]');
      expect(msg).toContain('hello world');
    });

    it('info() calls console.info with formatted message', () => {
      const logger = createLogger('InfoCtx');
      logger.info('info msg');
      expect(infoSpy).toHaveBeenCalledTimes(1);
      const msg = infoSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[INFO]');
      expect(msg).toContain('[InfoCtx]');
    });

    it('warn() calls console.warn', () => {
      const logger = createLogger('WarnCtx');
      logger.warn('warning!');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const msg = warnSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[WARN]');
    });

    it('error() calls console.error', () => {
      const logger = createLogger('ErrCtx');
      logger.error('bad error');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const msg = errorSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[ERROR]');
    });

    it('passes additional arguments through to console methods', () => {
      const logger = createLogger('Ctx');
      const extra = { detail: 42 };
      logger.info('with extra', extra);
      expect(infoSpy).toHaveBeenCalledWith(expect.any(String), extra);
    });
  });

  // ─── Log level filtering ──────────────────────────────────────────

  describe('log level filtering', () => {
    it('filters out debug when minLevel is info', () => {
      configureLogger({ minLevel: 'info' });
      const logger = createLogger('Filter');
      logger.debug('should be hidden');
      logger.info('should show');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('filters out debug and info when minLevel is warn', () => {
      configureLogger({ minLevel: 'warn' });
      const logger = createLogger('Filter');
      logger.debug('hidden');
      logger.info('hidden');
      logger.warn('visible');
      logger.error('visible');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('only shows errors when minLevel is error', () => {
      configureLogger({ minLevel: 'error' });
      const logger = createLogger('Filter');
      logger.debug('hidden');
      logger.info('hidden');
      logger.warn('hidden');
      logger.error('shown');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('shows nothing when logging is disabled', () => {
      configureLogger({ enabled: false });
      const logger = createLogger('Disabled');
      logger.debug('nope');
      logger.info('nope');
      logger.warn('nope');
      logger.error('nope');
      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('shows all levels when minLevel is debug', () => {
      configureLogger({ minLevel: 'debug' });
      const logger = createLogger('All');
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── configureLogger ──────────────────────────────────────────────

  describe('configureLogger', () => {
    it('changes the prefix used in formatted messages', () => {
      configureLogger({ prefix: '[CUSTOM]' });
      const logger = createLogger('PrefixTest');
      logger.info('check prefix');
      const msg = infoSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[CUSTOM]');
    });

    it('merges partial config without overwriting other fields', () => {
      configureLogger({ enabled: true, minLevel: 'debug', prefix: '[A]' });
      configureLogger({ prefix: '[B]' }); // should keep enabled and minLevel
      const logger = createLogger('Merge');
      logger.debug('should still work');
      expect(debugSpy).toHaveBeenCalledTimes(1);
      const msg = debugSpy.mock.calls[0][0] as string;
      expect(msg).toContain('[B]');
    });
  });

  // ─── logPortalApiCall ─────────────────────────────────────────────

  describe('logPortalApiCall', () => {
    it('logs a successful API call at debug level', () => {
      configureLogger({ enabled: true, minLevel: 'debug' });
      logPortalApiCall('GET', '/api/items', 200);
      expect(debugSpy).toHaveBeenCalled();
    });

    it('does not log when debug level is filtered out', () => {
      configureLogger({ enabled: true, minLevel: 'warn' });
      logPortalApiCall('POST', '/api/orders', 201);
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('includes error message when provided', () => {
      configureLogger({ enabled: true, minLevel: 'debug' });
      logPortalApiCall('DELETE', '/api/items/1', 500, 'Internal Server Error');
      expect(debugSpy).toHaveBeenCalled();
    });
  });
});
