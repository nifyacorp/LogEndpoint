# Cloud Run Deployment Commands

Below are the step-by-step commands to deploy the Log Endpoint service to Google Cloud Run. Each command can be run individually in the Google Cloud Console Cloud Shell.

## Step 1: Set Up Environment

Set your project ID:
```bash
export PROJECT_ID="delta-entity-447812-p2"
```

Configure gcloud to use your project:
```bash
gcloud config set project $PROJECT_ID
```

Enable necessary APIs:
```bash
gcloud services enable run.googleapis.com
```

```bash
gcloud services enable logging.googleapis.com
```

```bash
gcloud services enable cloudbuild.googleapis.com
```

## Step 2: Create a Service Account

Create a service account for the log endpoint:
```bash
export SA_NAME="log-endpoint-service-account"
```

```bash
gcloud iam service-accounts create $SA_NAME --display-name="Log Endpoint Service Account"
```

Grant the service account permission to read logs:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" --role="roles/logging.viewer"
```

## Step 3: Build and Deploy

Build the container image:
```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/log-endpoint
```

Deploy to Cloud Run:
```bash
gcloud run deploy log-endpoint \
  --image gcr.io/$PROJECT_ID/log-endpoint \
  --platform managed \
  --region us-central1 \
  --service-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars API_KEY=your-secure-api-key-here \
  --allow-unauthenticated
```

## Step 4: Get Service URL

Get the service URL to access your endpoint:
```bash
gcloud run services describe log-endpoint --format="value(status.url)"
```

## Step 5: Test the Endpoint

Test with curl (replace with your API key and target service name):
```bash
curl -X POST $(gcloud run services describe log-endpoint --format="value(status.url)")/query-logs \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secure-api-key-here" \
  -d '{"service":"your-target-service-name","limit":10}'
```

## Security Recommendation (Optional)

To restrict access and improve security, remove unauthenticated access:
```bash
gcloud run services update log-endpoint --no-allow-unauthenticated
```

Then grant specific users access:
```bash
gcloud run services add-iam-policy-binding log-endpoint \
  --member="user:your-email@example.com" \
  --role="roles/run.invoker"
```