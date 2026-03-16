---
created-at: 12 March 2026
updated-at: 12 March 2026
version: 0.2.0
---

# Tenant Manager Breakpoint Testing

## Revision Information
| Version | Date | Amendment | Author |
| ------- | ---- | --------- | ------ |
| 0.1.0 | 12 March 2026 | Initial Breakpoint Testing Plan | Tapaneeya Odmung |
| 0.1.1 | 12 March 2026 | Fix Markdown Syntax | Tapaneeya Odmung |
| 0.2.0 | 12 March 2026 | Adding recovery time check | Tapaneeya Odmung |
| 0.3.0 | 14 March 2026 | Adding test result | Tapaneeya Odmung |
| 0.4.0 | 16 March 2026 | Remove latency from test | Tapaneeya Odmung |

## BP01 - Tenant Manager Maximum Concurrent Request Limit
Description: Finding maximum number of concurrent request of tenant manager before system breakdown.  
Endpoint: https://api-vcluster-dev.staging.internal.aws.brickstech.co/api/v1  
Type: GET  
Duration: 30 min  
Steps:

    1. Load Authorization Token
    2. Load Tenant ID
    3. Load Tenant Provider
    4. Setting Header
        4.1. Authorization as Bearer ${Authorization Token}
        4.2. X-Tenant-ID as ${Tenant ID}
        4.3. X-Tenant-Provider as ${Tenant Provider}
    5. Set concurrent request as 10 requests
    6. Send HTTP GET request to the Endpoint
    7. Check if requests taking longer than 1 seconds or HTTP response does not within range of 200 - 299  (inclusive)
        7.1. If Success Rate = 100% AND Latency < 1s, increase load.
        7.2. If Success Rate < 95% for more than 30 seconds, mark this as the Breakpoint and begin the "Scale Down" phase.
    8. Mark a failure timestamp
    9. Set concurrent request as 1 requests
    10. Send HTTP GET request to the Endpoint
    11. Check if the request taking less than 1 seconds or HTTP respones is in range of 200 - 299 (inclusive)
        11.1. If Success, mark a recovery timestamp and end testing.
        11.2. If Not Success, wait 5 seconds and repeat step 10.

Expected Outcome:

    - Maximum concurrent request before system breakdown. 
    - CPU and Memory usage of a system.
    - Recovery time after system breakdown.

## Results
| # | Max VUs | Down time | Up time | Recovery Time | Tenant Manager Max CPU Usage | Tenant Manager Max Memory Usage | KGateway Max CPU Usage | KGateway Max Memory Usage | RDS Max CPU Usage | Supabase Max CPU Usage | Supabase Max Memory Usage |
| - | ------- | --------- | ------- | ------------- | ---------------------------- | ------------------------------- | ---------------------- | ------------------------- | ----------------- | ---------------------- | ------------------------- |
| 1 | 353 | 2026-03-14T14:06:06.763Z | 2026-03-14T14:06:28.139Z | 22s | 1.05 | 16.5 MB | 0.251 | 58.3 MB | 31.7 | 0.00133 | 372 MB|
