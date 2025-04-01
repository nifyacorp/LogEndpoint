const express = require('express');
const { Logging } = require('@google-cloud/logging');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple API key auth middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Log Endpoint', 
    status: 'running',
    endpoints: ['/query-logs']
  });
});

// Main logs query endpoint
app.post('/query-logs', apiKeyAuth, async (req, res) => {
  try {
    const { service, filter = '', limit = 1000 } = req.body;
    
    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
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
      message: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Log endpoint service listening on port ${port}`);
});