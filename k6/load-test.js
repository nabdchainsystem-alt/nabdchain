/**
 * NABD API Load Test (k6)
 *
 * Install: brew install k6
 * Run:     k6 run k6/load-test.js
 * With env: k6 run -e BASE_URL=https://api.nabdchain.com k6/load-test.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthLatency = new Trend('health_latency');
const apiLatency = new Trend('api_latency');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Bearer dev-token';

export const options = {
  // Ramp-up pattern
  stages: [
    { duration: '30s', target: 10 },   // Warm up to 10 users
    { duration: '1m', target: 50 },    // Ramp to 50 users
    { duration: '2m', target: 50 },    // Hold at 50 users
    { duration: '1m', target: 100 },   // Peak at 100 users
    { duration: '2m', target: 100 },   // Hold at peak
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],  // 95th percentile < 500ms
    errors: ['rate<0.05'],                             // Error rate < 5%
    health_latency: ['p(95)<100'],                     // Health check < 100ms
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN,
  };

  group('Health Checks', () => {
    const res = http.get(`${BASE_URL}/health`);
    healthLatency.add(res.timings.duration);
    check(res, {
      'health status 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  });

  group('API - Workspaces', () => {
    const res = http.get(`${BASE_URL}/api/workspaces`, { headers });
    apiLatency.add(res.timings.duration);
    check(res, {
      'workspaces status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
  });

  group('API - Boards', () => {
    const res = http.get(`${BASE_URL}/api/boards`, { headers });
    apiLatency.add(res.timings.duration);
    check(res, {
      'boards status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
  });

  group('API - Marketplace Items', () => {
    const res = http.get(`${BASE_URL}/api/items/marketplace`);
    apiLatency.add(res.timings.duration);
    check(res, {
      'marketplace status 200': (r) => r.status === 200,
    });
    errorRate.add(res.status >= 500);
  });

  group('Metrics Endpoint', () => {
    const res = http.get(`${BASE_URL}/metrics`);
    check(res, {
      'metrics status 200': (r) => r.status === 200,
    });
  });

  sleep(1); // Think time between iterations
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'k6/results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, opts) {
  // k6 built-in summary handles this
  return '';
}
