# Log Endpoint Service Requirements

## Overview
A simple service deployed to Cloud Run that fetches logs from other services in the same GCP project and exposes them through an HTTP endpoint.

## Functional Requirements
1. Expose an endpoint (e.g., `/query-logs`) to retrieve logs
2. Fetch the latest 1000 log lines from specified services
3. Support filtering logs by service name
4. Provide basic authentication for security

## Technical Approach
1. Use Google Cloud Logging API to query logs
2. Deploy as a lightweight service on Cloud Run
3. Implement simple authentication mechanism
4. Return logs in JSON format

## Implementation Plan
1. Create a simple web server (Express.js/Flask/Go)
2. Integrate with Google Cloud Logging client library
3. Implement authentication (API key or OAuth2)
4. Deploy to Cloud Run with appropriate IAM permissions

## Endpoints
- `POST /query-logs`
  - Request body: `{ "service": "backend", "filter": "severity>=ERROR", "limit": 1000 }`
  - Response: `{ "logs": [...log entries...] }`

## Security Considerations
- Restrict access with authentication
- Use IAM roles to limit log access permissions
- Consider rate limiting to prevent abuse