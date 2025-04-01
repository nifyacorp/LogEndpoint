# Log Endpoint Usage Guide

This document explains how to use the Log Endpoint service to retrieve logs from other services in the same GCP project.

## Service URL

```
https://logendpoint-415554190254.us-central1.run.app
```

## Authentication

All requests to the Log Endpoint service require API key authentication.

- Include your API key in the `x-api-key` header with every request
- Example: `x-api-key: nifya`

## Endpoints

### Health Check

```
GET /
```

Returns basic service status information.

**Example Response:**
```json
{ 
  "service": "Log Endpoint", 
  "status": "running",
  "endpoints": ["/query-logs"]
}
```

### Query Logs

```
POST /query-logs
```

Retrieves logs from a specified service.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| service | string | **Required**. The name of the service to retrieve logs from |
| filter | string | Optional. Additional filter criteria (see [Cloud Logging query syntax](https://cloud.google.com/logging/docs/view/logging-query-language)) |
| limit | number | Optional. Maximum number of log entries to return (default: 1000) |

**Example Request:**
```json
{
  "service": "backend",
  "filter": "severity>=ERROR",
  "limit": 10
}
```

**Response Format:**

The response contains a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| service | string | The service name that was queried |
| count | number | The number of log entries returned |
| logs | array | Array of log entries |

Each log entry in the `logs` array contains:

| Field | Type | Description |
|-------|------|-------------|
| timestamp | string | ISO 8601 timestamp when the log was created |
| severity | string | Log level (ERROR, WARNING, INFO, DEFAULT, etc.) |
| message | object/string | The log message content |
| resource | object | Information about the Cloud Run service |
| insertId | string | Unique identifier for the log entry |

## Usage Examples

### Using cURL

```bash
curl -X POST "https://logendpoint-415554190254.us-central1.run.app/query-logs" \
  -H "Content-Type: application/json" \
  -H "x-api-key: nifya" \
  -d '{"service":"backend","limit":10}'
```

### Using JavaScript (Fetch API)

```javascript
const fetchLogs = async () => {
  const response = await fetch('https://logendpoint-415554190254.us-central1.run.app/query-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'nifya'
    },
    body: JSON.stringify({
      service: 'backend',
      filter: 'severity>=ERROR',
      limit: 10
    })
  });
  
  const data = await response.json();
  console.log(data);
};

fetchLogs();
```

### Using Python (Requests)

```python
import requests
import json

url = 'https://logendpoint-415554190254.us-central1.run.app/query-logs'
headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'nifya'
}
payload = {
    'service': 'backend',
    'filter': 'severity>=ERROR',
    'limit': 10
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print(json.dumps(data, indent=2))
```

## Common Filter Examples

Filter logs for specific conditions:

- Error logs only: `severity>=ERROR`
- Specific date range: `timestamp>="2025-04-01T00:00:00Z" AND timestamp<="2025-04-01T23:59:59Z"`
- Specific text: `textPayload:"database error"`
- Container issues: `textPayload:"container failed"`
- Specific HTTP status code: `httpRequest.status=500`

## Troubleshooting

- **401 Unauthorized**: Check that you're providing the correct API key in the `x-api-key` header
- **400 Bad Request**: Ensure your request body is properly formatted and includes the required `service` field
- **500 Internal Server Error**: The service encountered an error - check the error message for details

For more information, check the [Cloud Logging documentation](https://cloud.google.com/logging/docs).