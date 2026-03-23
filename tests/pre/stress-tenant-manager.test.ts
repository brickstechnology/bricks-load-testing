import { check, sleep } from "k6";
import { type Options, type Stage } from "k6/options";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL;
if (!BASE_URL) {
  throw new Error("ERROR: BASE_URL is not set. Please check your environment variables.");
}

function createStressStages(): Stage[] {
  const stressCount = parseInt(__ENV.STRESS_COUNT || "0", 10);
  const stressWidth = parseInt(__ENV.STRESS_WIDTH || "0", 10)
  const steps = Math.floor(stressCount / stressWidth);
  const stages: Stage[] = [];

  if (steps === 0) return stages;

  for (let i = 1; i <= steps; ++i)
    stages.push({ duration: "1m", target: i * stressWidth });

  stages.push({ duration: "30m", target: stressCount });

  for (let i = steps - 1; i >= 0; --i)
    stages.push({ duration: "1m", target: i * stressWidth });

  return stages;
}

export const options: Options = {
  stages: createStressStages(),
  thresholds: {
    http_req_failed: ['rate < 0.01'], // 99 percent success rate
    http_req_duration: ['p(95) < 1000', 'p(99) < 2000'] // 95 percent of request should have less than 1 seconds latency
  }
}

export default function() {
  const BASE_URL = __ENV.BASE_URL;
  if (!BASE_URL) {
    console.log("ERROR: BASE_URL is not set. Please check you environment variable.");
    return;
  }

  const res = http.get(BASE_URL, {
    headers: {
      "Authorization": `Bearer ${__ENV.TOKEN}`,
      "X-Tenant-ID": __ENV.TENANT_ID || "",
      "X-Tenant-Provider": __ENV.TENANT_PROVIDER || "",
    }
  });

  check(res, {
    'is status 200': (r) => r.status >= 200 && r.status < 400,
  });
  sleep(1);
}
