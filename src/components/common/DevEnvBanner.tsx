/**
 * DevEnvBanner - Development environment indicator
 *
 * Shows a small badge in the bottom-right corner with:
 * - Environment name (DEV/STAGING)
 * - API base URL
 * - Build stamp (commit hash + build time)
 *
 * Only visible in development mode (not in production builds).
 */

import { useState } from 'react';
import { API_URL } from '../../config/api';

// Build stamp injected by Vite at build time
declare const __BUILD_STAMP__:
  | {
      commitHash: string;
      buildTime: string;
      env: string;
    }
  | undefined;

const buildStamp =
  typeof __BUILD_STAMP__ !== 'undefined'
    ? __BUILD_STAMP__
    : {
        commitHash: 'dev',
        buildTime: new Date().toISOString(),
        env: 'development',
      };

// Only show in non-production environments
const isProduction = buildStamp.env === 'production';

export function DevEnvBanner() {
  const [expanded, setExpanded] = useState(false);

  // Don't render in production
  if (isProduction) {
    return null;
  }

  const envLabel = buildStamp.env === 'development' ? 'DEV' : buildStamp.env.toUpperCase();
  const shortCommit = buildStamp.commitHash.slice(0, 7);
  const buildDate = new Date(buildStamp.buildTime).toLocaleString();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 99999,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
        userSelect: 'none',
      }}
    >
      {/* Collapsed badge */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            backgroundColor: buildStamp.env === 'development' ? '#fef3c7' : '#dbeafe',
            color: buildStamp.env === 'development' ? '#92400e' : '#1e40af',
            border: `1px solid ${buildStamp.env === 'development' ? '#fcd34d' : '#93c5fd'}`,
            borderRadius: 4,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontFamily: 'inherit',
            fontSize: 'inherit',
          }}
          title="Click to expand environment details"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: buildStamp.env === 'development' ? '#f59e0b' : '#3b82f6',
            }}
          />
          <span style={{ fontWeight: 600 }}>{envLabel}</span>
          <span style={{ opacity: 0.7 }}>{shortCommit}</span>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div
          style={{
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            borderRadius: 6,
            padding: 12,
            minWidth: 240,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: '1px solid #374151',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: buildStamp.env === 'development' ? '#f59e0b' : '#3b82f6',
                }}
              />
              {envLabel} Environment
            </span>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: 2,
                fontSize: 14,
                lineHeight: 1,
              }}
              title="Collapse"
            >
              &times;
            </button>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>
              <span style={{ color: '#9ca3af', marginRight: 8 }}>API:</span>
              <span style={{ color: '#a5f3fc' }}>{API_URL}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af', marginRight: 8 }}>Commit:</span>
              <span style={{ color: '#fde68a' }}>{buildStamp.commitHash}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af', marginRight: 8 }}>Built:</span>
              <span style={{ color: '#d1d5db' }}>{buildDate}</span>
            </div>
          </div>

          {/* Health check link */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #374151' }}>
            <a
              href={`${API_URL}/health`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#60a5fa',
                textDecoration: 'none',
                fontSize: 10,
              }}
            >
              Check API Health &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevEnvBanner;
