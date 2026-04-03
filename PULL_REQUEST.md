## Summary

Adds an AI-powered routing endpoint (`POST /leads/route`) that classifies inbound real estate inquiries and assigns them to the appropriate pipeline. The router uses GPT-4o to analyze the inquiry text alongside any existing lead history, with a fallback to GPT-4o-mini if the primary model is unavailable.

## Test Plan

- Tested locally with sample inquiries for each pipeline type
- Verified fallback behavior by simulating API errors
- Confirmed existing `/leads` and `/health` endpoints are unaffected
