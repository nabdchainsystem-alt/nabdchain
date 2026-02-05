/**
 * API Versioning Middleware
 *
 * Handles API version detection from URL path, adds deprecation/sunset headers,
 * and attaches version info to requests.
 *
 * URL Pattern: /api/v1/*, /api/v2/*, etc.
 * Unversioned /api/* routes default to v1 for backward compatibility.
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

export interface VersionConfig {
  current: string;          // Current recommended version
  supported: string[];      // All supported versions
  deprecated: string[];     // Deprecated versions (still working, with warning)
  sunset: Record<string, string>; // Version -> Sunset date (ISO 8601)
}

/**
 * Version configuration
 * Update this when adding new API versions or deprecating old ones
 */
export const VERSION_CONFIG: VersionConfig = {
  current: 'v1',
  supported: ['v1'],
  deprecated: [],
  sunset: {
    // Example: 'v0': '2025-12-31T23:59:59Z'
  },
};

/**
 * API Version Middleware
 *
 * - Extracts version from URL path (e.g., /api/v1/orders -> v1)
 * - Defaults to 'v1' for unversioned routes
 * - Adds standard headers: X-API-Version, Deprecation, Sunset
 * - Attaches version to request object for downstream use
 */
export function apiVersionMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract version from URL: /api/v1/orders -> v1
    const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
    const version = pathMatch ? pathMatch[1] : VERSION_CONFIG.current;

    // Attach version to request for downstream handlers
    req.apiVersion = version;

    // Always add current version header
    res.setHeader('X-API-Version', version);

    // Add deprecation warning if this version is deprecated
    if (VERSION_CONFIG.deprecated.includes(version)) {
      res.setHeader('Deprecation', 'true');
      res.setHeader(
        'X-API-Deprecated',
        `API version ${version} is deprecated. Please migrate to ${VERSION_CONFIG.current}.`
      );
    }

    // Add sunset header if version has a planned sunset date
    const sunsetDate = VERSION_CONFIG.sunset[version];
    if (sunsetDate) {
      res.setHeader('Sunset', sunsetDate);
    }

    // Check if version is supported
    if (!VERSION_CONFIG.supported.includes(version) && pathMatch) {
      res.status(400).json({
        error: 'Unsupported API version',
        message: `API version '${version}' is not supported. Supported versions: ${VERSION_CONFIG.supported.join(', ')}`,
        currentVersion: VERSION_CONFIG.current,
      });
      return;
    }

    next();
  };
}

/**
 * Get API version info endpoint handler
 * Returns information about available API versions
 */
export function getApiVersionInfo(_req: Request, res: Response): void {
  res.json({
    currentVersion: VERSION_CONFIG.current,
    supportedVersions: VERSION_CONFIG.supported,
    deprecatedVersions: VERSION_CONFIG.deprecated,
    sunsetDates: VERSION_CONFIG.sunset,
  });
}

/**
 * Helper to check if a version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  return VERSION_CONFIG.deprecated.includes(version);
}

/**
 * Helper to check if a version is supported
 */
export function isVersionSupported(version: string): boolean {
  return VERSION_CONFIG.supported.includes(version);
}
