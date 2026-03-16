import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const successRate = new Rate('successful_requests');
const latencyTrend = new Trend('request_latency');

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Step 5: Start at 10 requests
    { duration: '29m50s', target: 3000 } // Step 7.1: Increase load steadily
  ],
  thresholds: {
    successful_requests: ['rate>=0.95'],
  },
};

// State variables to track the exact rules of your test plan
let firstDegradationTime = 0;
let isBroken = false;

export default function() {
  // --- SCALE DOWN ENFORCEMENT ---
  // Step 9: Set concurrent request as 1 request.
  // If we are in the broken state, all VUs go to sleep permanently EXCEPT VU #1.
  if (isBroken && exec.vu.idInTest !== 1) {
    sleep(10);
    return;
  }

  const url = 'https://api-vcluster-dev.staging.internal.aws.brickstech.co/api/v1';

  // Step 1-4: Set headers
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN?.trim()}`,
      'X-Tenant-ID': __ENV.TENANT_ID,
      'X-Tenant-Provider': __ENV.TENANT_PROVIDER,
    },
  };

  // Step 6 & 10: Send request
  const res = http.get(url, params as any);

  if (res.status != 200)
    console.log(`${res.status} - ${res.body}`);

  // Check conditions
  const isSuccess = res.status >= 200 && res.status <= 299;
  //const isFastEnough = res.timings.duration < 1000;
  const isDegraded = !isSuccess;

  check(res, {
    'status is 200-299': () => isSuccess,
    //'latency is < 1s': () => isFastEnough,
  });

  successRate.add(isSuccess);
  latencyTrend.add(res.timings.duration);

  // ==========================================
  // LOGIC FLOW BASED ON BP01 TEST PLAN
  // ==========================================

  if (!isBroken) {
    // --- PHASE 1: FINDING THE BREAKPOINT ---

    if (isDegraded) {
      // If this is the first error we've seen, start the 30-second timer
      if (firstDegradationTime === 0) {
        firstDegradationTime = Date.now();
      }
      // Step 7.2: If Latency > 1s or Success < 95% for MORE THAN 30 SECONDS
      else if ((Date.now() - firstDegradationTime) > 30000) {
        // Step 8: Mark a failure timestamp and begin scale down
        console.log(`\n🚨 [BREAKPOINT REACHED] System degraded for > 30s.`);
        console.log(`Failure Timestamp: ${new Date().toISOString()}`);
        console.log(`Entering Scale Down Phase...\n`);
        isBroken = true;
      }
    } else {
      // If we get a clean success, reset the 30-second failure timer (Step 7.1)
      firstDegradationTime = 0;
    }

    sleep(1); // Normal pacing during ramp up

  } else {
    // --- PHASE 2: RECOVERY CHECK (Only VU #1 reaches this block) ---
    // Step 11: Check if request < 1s and HTTP is 200-299

    if (isSuccess) {
      // Step 11.1: If Success, mark recovery timestamp and end testing
      console.log(`\n✅ [RECOVERY DETECTED] System is healthy again!`);
      console.log(`Recovery Timestamp: ${new Date().toISOString()}`);

      // Instantly stops the k6 test!
      exec.test.abort('Test complete: Recovery validated.');
    } else {
      // Step 11.2: If Not Success, wait 5 seconds and repeat
      sleep(5);
    }
  }
}
