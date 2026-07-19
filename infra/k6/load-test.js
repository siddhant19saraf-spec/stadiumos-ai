import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "5m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "5m", target: 200 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<3000"],
    http_req_failed: ["rate<0.05"],
    checks: ["rate>0.95"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

const errorRate = new Rate("errors");

export default function () {
  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/api/v1/health`);
    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health response has status": (r) => JSON.parse(r.body).status === "healthy",
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  group("API Discovery", () => {
    const res = http.get(`${BASE_URL}/api/v1`);
    check(res, {
      "api discovery is 200": (r) => r.status === 200,
      "api response has name": (r) => JSON.parse(r.body).name !== undefined,
    });
    errorRate.add(res.status !== 200);
    sleep(2);
  });

  group("Documentation", () => {
    const res = http.get(`${BASE_URL}/api/v1/docs`);
    check(res, {
      "docs is 200": (r) => r.status === 200 || r.status === 302,
    });
    errorRate.add(res.status >= 400);
    sleep(1);
  });

  group("AI Chat Simulation", () => {
    const payload = JSON.stringify({
      message: "What is the current stadium capacity?",
      context: { module: "command-center" },
    });
    const params = {
      headers: { "Content-Type": "application/json" },
    };
    const res = http.post(`${BASE_URL}/api/v1/ai/chat`, payload, params);
    check(res, {
      "ai chat responds": (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
    sleep(3);
  });
}
