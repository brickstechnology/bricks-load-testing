---
created-at: 12 March 2026
updated-at: 12 March 2026
version: 0.1.1
---

# Tenant Manager Breakpoint Testing

## Revision Information
| Version | Date | Amendment | Author |
| ------- | ---- | --------- | ------ |
| 0.1.0 | 12 March 2026 | Initial Breakpoint Testing Plan | Tapaneeya Odmung |
| 0.1.1 | 12 March 2026 | Fix Markdown Syntax | Tapaneeya Odmung |

## BP01 - Tenant Manager Maximum Concurrent Request Limit
Description: Finding maximum number of concurrent request of tenant manager before system breakdown.
Endpoint: [https://api-vcluster-dev.staging.internal.aws.brickstech.co/api/v1]
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
        7.1: If Success Rate = 100% AND Latency < 1s, increase load.
        7.2: If Success Rate < 95% OR Latency > 1s for more than 30 seconds, mark this as the Breakpoint and begin the "Scale Down" phase.
Expected Outcome:
    - Maximum concurrent request before system breakdown. 
    - CPU and Memory usage of a system.
