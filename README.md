# Log Endpoint

A simple service that retrieves logs from other services in the same Google Cloud project and exposes them through a REST API endpoint.

## Features

- Query logs from any service in the same GCP project
- Filter logs by service name, severity, and other criteria
- Secure access with API key authentication
- Lightweight and easy to deploy on Cloud Run

## Setup

### Prerequisites

- Node.js 16+
- Google Cloud account with appropriate permissions
- `gcloud` CLI installed (for deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LogEndpoint.git
cd LogEndpoint
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
```bash
cp .env.example .env
# Edit .env file with your API key
```

4. Start the development server:
```bash
npm run dev
```

### Authentication

To authenticate with GCP locally:

```bash
# Set up application default credentials
gcloud auth application-default login

# Or use a service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

## Deployment to Cloud Run

1. Build and deploy the service:
```bash
# Build using Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/log-endpoint

# Deploy to Cloud Run
gcloud run deploy log-endpoint \
  --image gcr.io/YOUR_PROJECT_ID/log-endpoint \
  --platform managed \
  --set-env-vars API_KEY=your-secure-api-key \
  --allow-unauthenticated
```

2. Set the necessary IAM permissions:
```bash
# Grant the service account access to Cloud Logging
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"
```

## API Usage

### Querying Logs

```
POST /query-logs
Headers:
  x-api-key: your-api-key

Body:
{
  "service": "your-service-name",
  "filter": "severity>=ERROR",
  "limit": 1000
}
```

Response:
```json
{
  "service": "your-service-name",
  "count": 42,
  "logs": [
    {
      "timestamp": "2025-04-01T10:15:30.123Z",
      "severity": "ERROR",
      "message": "Error details here",
      "resource": {
        "type": "cloud_run_revision",
        "labels": {
          "service_name": "your-service-name"
        }
      },
      "insertId": "abc123def456"
    },
    // More log entries...
  ]
}
```

## License

MIT