const express = require('express');
const { Logging } = require('@google-cloud/logging');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({
  // Add error handling for malformed JSON
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        error: 'Invalid JSON format',
        usage: getUsageInstructions('invalid-json')
      });
      throw new Error('Invalid JSON');
    }
  }
}));

// Usage instructions for different error scenarios
const getUsageInstructions = (type) => {
  const baseInstructions = {
    endpoint: '/query-logs',
    method: 'POST',
    authentication: 'Include x-api-key header with your API key',
    documentation: 'Visit /help for complete documentation'
  };

  // JavaScript example template with the correct service URL
  const jsExample = `// JavaScript Example
const fetchLogs = async () => {
  try {
    const response = await fetch('https://logendpoint-415554190254.us-central1.run.app/query-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'nifya' // Replace with your API key
      },
      body: JSON.stringify({
        service: 'backend', // Required: Name of the service to query logs from
        filter: 'severity>=ERROR', // Optional: Filter criteria
        limit: 10 // Optional: Maximum number of logs to return
      })
    });
    
    const data = await response.json();
    console.log(data);
    
    // Handle the logs data
    if (data.logs && data.logs.length > 0) {
      data.logs.forEach(log => {
        console.log(\`[\${log.timestamp}] [\${log.severity}] \${JSON.stringify(log.message)}\`);
      });
    } else {
      console.log('No logs found');
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
};

// Call the function to fetch logs
fetchLogs();`;

  switch (type) {
    case 'unauthorized':
      return {
        ...baseInstructions,
        error: 'API key is missing or invalid',
        example: {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'your-api-key'
          },
          body: {
            service: 'backend'
          }
        },
        javascriptExample: jsExample
      };
    case 'missing-service':
      return {
        ...baseInstructions,
        error: 'Service name is required',
        example: {
          body: {
            service: 'backend',  // Required
            filter: 'severity>=ERROR',  // Optional
            limit: 10  // Optional
          }
        },
        javascriptExample: jsExample
      };
    case 'invalid-json':
      return {
        ...baseInstructions,
        error: 'Request body must be valid JSON',
        example: {
          body: {
            service: 'backend',
            filter: 'severity>=ERROR',
            limit: 10
          }
        },
        javascriptExample: jsExample
      };
    default:
      return {
        ...baseInstructions,
        javascriptExample: jsExample
      };
  }
};

// Simple API key auth middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      usage: getUsageInstructions('unauthorized')
    });
  }
  next();
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Log Endpoint', 
    status: 'running',
    endpoints: ['/query-logs', '/help'],
    documentation: 'Visit /help for detailed usage instructions'
  });
});

// Help endpoint - returns usage documentation
app.get('/help', (req, res) => {
  try {
    // Read the usage guide markdown
    const usageGuidePath = path.join(__dirname, 'usage-guide.md');
    
    if (fs.existsSync(usageGuidePath)) {
      const usageGuide = fs.readFileSync(usageGuidePath, 'utf8');
      res.setHeader('Content-Type', 'text/markdown');
      res.send(usageGuide);
    } else {
      // Fallback to JSON if file doesn't exist
      res.json({
        service: 'Log Endpoint',
        description: 'A service for retrieving logs from other services in the same GCP project',
        authentication: 'API key required in x-api-key header',
        endpoints: [
          {
            path: '/query-logs',
            method: 'POST',
            description: 'Retrieve logs from a specified service',
            required_fields: ['service'],
            optional_fields: ['filter', 'limit'],
            example: {
              request: {
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': 'your-api-key'
                },
                body: {
                  service: 'backend',
                  filter: 'severity>=ERROR',
                  limit: 10
                }
              }
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error serving help documentation:', error);
    res.status(500).json({ error: 'Failed to retrieve documentation' });
  }
});

// Main logs query endpoint
app.post('/query-logs', apiKeyAuth, async (req, res) => {
  try {
    const { service, filter = '', limit = 1000 } = req.body;
    
    if (!service) {
      return res.status(400).json({ 
        error: 'Service name is required',
        usage: getUsageInstructions('missing-service')
      });
    }

    const logging = new Logging();
    const customFilter = `resource.type="cloud_run_revision" resource.labels.service_name="${service}" ${filter}`;
    
    console.log(`Querying logs with filter: ${customFilter}`);
    
    const [entries] = await logging.getEntries({
      filter: customFilter,
      pageSize: limit,
      orderBy: 'timestamp desc',
    });

    const logs = entries.map(entry => ({
      timestamp: entry.metadata.timestamp,
      severity: entry.metadata.severity,
      message: entry.data,
      resource: entry.metadata.resource,
      insertId: entry.metadata.insertId
    }));

    res.json({ 
      service,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve logs',
      message: error.message,
      usage: getUsageInstructions()
    });
  }
});

// Generic 404 handler with usage instructions
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/query-logs', '/help'],
    documentation: 'Visit /help for detailed usage instructions'
  });
});

// Error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    usage: getUsageInstructions()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Log endpoint service listening on port ${port}`);
});