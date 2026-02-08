import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { sanitizeString, sanitizeObject, ValidationSchemas, rateLimiters, rateLimit } from './security';

describe('sanitizeString', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes backticks', () => {
    expect(sanitizeString('hello `world`')).toBe('hello &#x60;world&#x60;');
  });

  it('escapes ampersands', () => {
    expect(sanitizeString('a & b')).toBe('a &amp; b');
  });

  it('escapes single quotes', () => {
    expect(sanitizeString("it's")).toBe('it&#x27;s');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values in objects', () => {
    const input = { name: '<script>xss</script>', age: 25 };
    const result = sanitizeObject(input);
    expect(result.name).toBe('&lt;script&gt;xss&lt;/script&gt;');
    expect(result.age).toBe(25);
  });

  it('sanitizes nested arrays', () => {
    const input = ['<b>bold</b>', 'normal'];
    const result = sanitizeObject(input);
    expect(result[0]).toBe('&lt;b&gt;bold&lt;/b&gt;');
    expect(result[1]).toBe('normal');
  });

  it('handles null and undefined', () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });
});

describe('ValidationSchemas', () => {
  it('validates UUID format', () => {
    expect(ValidationSchemas.uuid.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(ValidationSchemas.uuid.safeParse('not-a-uuid').success).toBe(false);
  });

  it('validates email format', () => {
    expect(ValidationSchemas.email.safeParse('user@example.com').success).toBe(true);
    expect(ValidationSchemas.email.safeParse('not-email').success).toBe(false);
  });

  it('validates password length', () => {
    expect(ValidationSchemas.password.safeParse('short').success).toBe(false);
    expect(ValidationSchemas.password.safeParse('longenough123').success).toBe(true);
  });

  it('rejects script injection in name', () => {
    expect(ValidationSchemas.name.safeParse('<script>').success).toBe(false);
    expect(ValidationSchemas.name.safeParse('John Doe').success).toBe(true);
  });

  it('validates pagination', () => {
    const result = ValidationSchemas.pagination.safeParse({ page: 1, limit: 20 });
    expect(result.success).toBe(true);

    const badLimit = ValidationSchemas.pagination.safeParse({ page: 1, limit: 999 });
    expect(badLimit.success).toBe(false);
  });
});

describe('rateLimiters', () => {
  it('creates rate limiter middleware functions', () => {
    expect(typeof rateLimiters.strict).toBe('function');
    expect(typeof rateLimiters.standard).toBe('function');
    expect(typeof rateLimiters.relaxed).toBe('function');
    expect(typeof rateLimiters.auth).toBe('function');
    expect(typeof rateLimiters.upload).toBe('function');
  });

  it('rate limiter blocks after max requests', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 3 });
    const req = { ip: `test-ip-${Date.now()}` } as Request;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    // First 3 should pass
    for (let i = 0; i < 3; i++) {
      next.mockClear();
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    // 4th should be blocked
    next.mockClear();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
