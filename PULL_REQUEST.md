## Summary

Adds a batch ingestion endpoint (`POST /leads/batch`) that accepts a CSV file upload of leads (e.g., from an open house sign-in sheet), routes each lead through the AI router, persists the results, and notifies the assigned team via webhook.

## Test Plan

- Uploaded sample CSVs with 5, 50, and 200 rows and verified all leads were routed
- Tested with malformed CSV (missing columns) and confirmed errors are captured per-row
- Verified webhook notifications fire for each successfully routed lead
