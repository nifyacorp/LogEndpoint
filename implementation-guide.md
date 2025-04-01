# Log Endpoint Implementation Guide

## Option 1: Custom Implementation

### Node.js Implementation (Express)

```javascript
const express = require('express');
const {Logging} = require('@google-cloud/logging');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Simple API key auth middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/query-logs', apiKeyAuth, async (req, res) => {
  try {
    const { service, filter = '', limit = 1000 } = req.body;
    
    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const logging = new Logging();
    const customFilter = `resource.type="cloud_run_revision" resource.labels.service_name="${service}" ${filter}`;
    
    const [entries] = await logging.getEntries({
      filter: customFilter,
      pageSize: limit,
      orderBy: 'timestamp desc',
    });

    res.json({ logs: entries.map(entry => ({
      timestamp: entry.metadata.timestamp,
      severity: entry.metadata.severity,
      message: entry.data,
    }))});
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

app.listen(port, () => {
  console.log(`Log endpoint service listening on port ${port}`);
});
```

### Python Implementation (Flask)

```python
import os
from flask import Flask, request, jsonify
from google.cloud import logging

app = Flask(__name__)

@app.route('/query-logs', methods=['POST'])
def query_logs():
    # API key auth
    api_key = request.headers.get('x-api-key')
    if not api_key or api_key != os.environ.get('API_KEY'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    service = data.get('service')
    filter_text = data.get('filter', '')
    limit = data.get('limit', 1000)
    
    if not service:
        return jsonify({'error': 'Service name is required'}), 400
    
    try:
        client = logging.Client()
        custom_filter = f'resource.type="cloud_run_revision" resource.labels.service_name="{service}" {filter_text}'
        
        entries = client.list_entries(
            filter_=custom_filter,
            page_size=limit,
            order_by="timestamp desc"
        )
        
        logs = [{
            'timestamp': entry.timestamp.isoformat(),
            'severity': entry.severity,
            'message': entry.payload
        } for entry in entries]
        
        return jsonify({'logs': logs})
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return jsonify({'error': 'Failed to retrieve logs'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

## Option 2: Use Existing Solutions

### 1. Google Cloud Console Logs Explorer

- Built-in solution: https://console.cloud.google.com/logs
- Pros: No implementation needed, full-featured
- Cons: Requires console access, not API-driven

### 2. Google Cloud Logging API Directly

- Use the API through curl or Postman: https://cloud.google.com/logging/docs/reference/v2/rest
- Pros: Full control over queries
- Cons: Requires manual authentication handling

### 3. Open Source Options

- [Grafana Loki](https://github.com/grafana/loki) - Log aggregation system
  - Can be configured to pull from GCP logs
  - Provides robust querying capabilities
  - Requires additional setup

- [Fluentbit](https://github.com/fluent/fluent-bit) - Log processor and forwarder
  - Can act as a gateway to expose logs via HTTP

## Deployment Instructions

1. Create a service account with `logging.viewer` permissions
2. Build and deploy to Cloud Run:
```bash
# For Node.js
gcloud run deploy log-endpoint --source . --platform managed --allow-unauthenticated

# For Python
gcloud run deploy log-endpoint --source . --platform managed --allow-unauthenticated
```
3. Set environment variables including API_KEY
4. Configure IAM to allow this service to read logs from other services

## Security Best Practices

1. Use a service account with minimal permissions
2. Do not allow unauthenticated access in production
3. Consider adding IP restrictions
4. Rotate API keys regularly