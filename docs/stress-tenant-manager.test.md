---
created-at: 23 March 2026
updated-at: 23 March 2026
version: 0.1.0
---

# Tenant Manager Stress Testing

## Revision Information
| Version | Date | Amendment | Author |
| ------- | ---- | --------- | ------ |
| 0.1.0 | 23 March 2026 | Initial Stress Testing Plan | Tapaneeya Odmung |

## ST01 - Tenant Manager behavior in high concurrent user
Description: Checking system behaviour after failure and recovery  
Endpoint: https://api-vcluster-dev.staging.internal.aws.brickstech.co/api/v1  
Type: GET  
Duration: 45 minutes 
Steps:

    1. Load Authorization Token
    2. Load Tenant ID
    3. Load Tenant Provider
    4. Setting Header
        4.1. Authorization as Bearer ${Authorization Token}
        4.2. X-Tenant-ID as ${Tenant ID}
        4.3. X-Tenant-Provider as ${Tenant Provider}
    5. Set concurrent request as 0 requests
    6. Send HTTP GET request to the Endpoint
    7. Check if requests HTTP response does not within range of 200 - 299  (inclusive)
    8. Retrive result for 1 minutes
    9. Increase the load by 10 and repeat step 5 until reaching 350 vus
    8. Stay at 350 vus for 30 minutes
    9. Reduce the load by 10 requests
    10. Retrive results for 1 minutes until reaching 0

Expected Outcome:

- Success Rate: 100% success (2xx responses) up to the documented "Safe Load" limit.
- Latency Stability: Response times (p95/p99) should remain under a specific threshold (e.g., < 500ms) until the 350 VUs peak.
- Self-Healing: After the load is reduced (Step 9-10), the system should automatically recover to baseline performance without manual intervention.
- Resource Utilization: CPU and Memory on the vcluster should stay below 80% to avoid OOM (Out of Memory) kills.

## Results

## Analysis

## Conclusion

## Action plan
