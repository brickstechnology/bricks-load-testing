---
created-at: 23 March 2026
updated-at: 27 March 2026
version: 0.2.0
---

# Tenant Manager Stress Testing

## Revision Information
| Version | Date | Amendment | Author |
| ------- | ---- | --------- | ------ |
| 0.1.0 | 23 March 2026 | Initial Stress Testing Plan | Tapaneeya Odmung |
| 0.2.0 | 27 March 2026 | Added Testing Result | Tapaneeya Odmung |

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
1) K6  
![2026-03-16 K6](../results/2026-03-16%20ST01/2026-03-16%20K6.png)  
2) Tenant Manager  
![2026-03-16 Tenant Manager](../results/2026-03-16%20ST01/2026-03-16%20Tenant%20Manager.png)  
3) KGateway  
![2026-03-16 KGateway](../results/2026-03-16%20ST01/2026-03-16%20KGateway.png)
4) RDS  
![2026-03-16 RDS](../results/2026-03-16%20ST01/2026-03-16%20RDS.png)  

## Analysis
K6 results show that as Virtual Users (VUs) ramped up to the target of 350, the Requests Per Second (RPS) stabilized at approximately 300 RPS. During this ramp-up, the p99 request duration scaled linearly from ~150ms to a peak of ~380ms. Crucially, during the 30-minute sustained max load phase, the latency plateaued and remained stable, indicating the system queued and processed requests predictably.

On the application side, the Tenant Manager handled the load well but proved to be CPU-intensive, mirroring the load curve perfectly and peaking precisely at ~2.0 vCPU units. Memory usage was highly stable, fluctuating slightly between 15MB and 25MB with no signs of memory leaks. 

KGateway remained very lightweight on CPU, peaking at only ~0.55 vCPU. However, there is a strong suspect of a memory leak on KGateway. The KGateway Memory Usage graph shows a "stepped" increase—jumping from 24MB to roughly 30.5MB at 16:00—and critically, it did not release the memory back to the baseline after the load was completely reduced to 0 VUs at 16:40. This residual memory footprint indicates that objects are not being properly garbage-collected or connections are hanging.

For the database layer, RDS CPU utilization peaked at a healthy 65-70% and flattened out during the sustained load. Read and Write IOPS remained negligible, proving this workload is not I/O bound. However, the RDS CPU Credit Balance continuously declined from ~580 to ~520 over the duration of the test. 

## Conclusion
The system successfully handled the target peak load of 350 VUs (~300 RPS) for the required duration without breaking down. The expected outcomes for latency stability and self-healing were generally met, as the p99 response time remained well under 500ms. 

However, there are two primary risks identified for long-term stability:
1. A suspected memory leak in KGateway. While the footprint is currently small, accumulating unreleased memory over time will eventually lead to Out-Of-Memory (OOM) pod evictions and dropped requests.
2. The steady drain on the RDS CPU Credit Balance. Because the database is utilizing a burstable instance type, a sustained load of 300 RPS lasting for several hours will eventually exhaust all CPU credits, leading to severe CPU throttling and massive latency spikes.

## Action plan
1. Investigate the KGateway service for the suspected memory leak (e.g., check for unclosed HTTP response bodies, hanging connections/goroutines, or unbounded caching) and profile its memory usage.
2. Evaluate the expected real-world sustained load duration; if continuous 300 RPS is expected for long periods, migrate the RDS instance from a burstable type (e.g., T-series) to a fixed-performance instance (e.g., M or C-series).
3. Ensure Tenant Manager Kubernetes pod CPU limits are configured with an adequate buffer above 2.0 cores to prevent throttling at 350 VUs.
4. Conduct a longer Endurance Test (e.g., 4–8 hours) after the KGateway leak is addressed to verify system stability over extended periods.
5. Establish ~380ms as the baseline p99 latency expectation for 300 RPS throughput in future SLI/SLO tracking.
