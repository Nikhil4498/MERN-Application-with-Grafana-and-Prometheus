# Travel Memory MERN Application – Advanced Monitoring Setup

This project enhances a MERN (MongoDB, Express, React, Node.js) application with **advanced observability tools**:

- Real-time metrics via **Prometheus**
- Interactive dashboards in **Grafana**
- Database monitoring using **MongoDB Exporter**
- Log aggregation using **Loki + Promtail**
- Alerting (Grafana) and Distributed Tracing (optional)

---

## 📂 File Structure
```
travel-memory-monitoring/
├── backend/
│   ├── conn.js
│   ├── index.js
│   ├── logger.js
│   ├── metrics.js
│   ├── server.js
│   ├── routes/
│   │   └── trip.routes.js
│   ├── logs/
│   │   └── app.log
│   ├── .env
│   └── package.json
├── docker-compose.yml
├── prometheus.yml
├── loki-config.yaml
├── promtail-config.yaml
└── README.md ✅
```

---

## ✅ Step-by-Step Setup Guide

### Step 1: Clone the Project
```bash
git clone https://github.com/your-username/travel-memory-monitoring.git
cd travel-memory-monitoring
```

### Step 2: Start the Backend
```bash
cd backend
npm install
```
![image](https://github.com/user-attachments/assets/891cff7e-c738-4eeb-9618-0c069d72937f)

Create a `.env` file:
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/TravelMemory-Mern
```
![image](https://github.com/user-attachments/assets/f143364d-3319-4b3a-9464-36d1cf5bd4d5)

Start the server:
```bash
npm run dev
```
- Your backend runs at: `http://localhost:3001`
- Prometheus metrics available at: `http://localhost:3001/metrics`

![image](https://github.com/user-attachments/assets/b320a9d7-b6b8-442e-b3e1-a6bfa39fea56)

### Step 3: Start the Monitoring Stack with Docker
```bash
docker-compose up -d
```
![image](https://github.com/user-attachments/assets/897b7422-7b85-41f6-a8d5-df8330b86147)

![image](https://github.com/user-attachments/assets/b50727d6-d70f-4245-9f40-731d39fcb1eb)


This starts:
- MongoDB
- MongoDB Exporter
- Prometheus
- Grafana
- Loki
- Promtail

### Step 4: Access Grafana
- URL: [http://localhost:3000](http://localhost:3000)
- Login: `admin / admin`
  
![image](https://github.com/user-attachments/assets/465a338a-0a2c-49ed-866c-8fd91b03fa68)

![image](https://github.com/user-attachments/assets/0c374a2b-2fbc-47a3-928f-2bf37d4fe67a)

![image](https://github.com/user-attachments/assets/89bd961d-df52-4cd4-8330-353ab0f5e5c5)


Add Loki and Prometheus as data sources:
1. Go to **Settings > Data Sources**
2. Add **Loki**
   - URL: `http://loki:3100`
   - Save & Test ➜ should say "Data source is working"

Metrics to observe:
- Node.js default metrics (CPU, memory, GC)
- Custom Express route metrics: `http_request_duration_seconds`
- MongoDB metrics via mongodb-exporter

### Step 5: API Routes
| Method | Endpoint | Description              |
|--------|----------|--------------------------|
| GET    | /hello   | Health check             |
| GET    | /trip    | Fetch all trips          |
| POST   | /trip    | Add a new trip           |
| GET    | /metrics | Prometheus metrics scrape|


---

## 🔧 Key Features
- Track CPU, memory, and event loop performance
- Analyze HTTP request durations
- Monitor MongoDB health & performance
- Aggregate logs via Promtail & Loki
- Explore metrics and logs in Grafana
- Setup alerts and distributed tracing (optional)

---

## 🛠️ Key Files

### conn.js
```js
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/TravelMemory-Mern', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

module.exports = mongoose;
```

### logger.js
```js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, 'logs', 'app.log') }),
  ],
});

module.exports = logger;
```

### metrics.js
```js
const client = require('prom-client');
const express = require('express');
const router = express.Router();

if (!global.prometheusClientInitialized) {
  client.collectDefaultMetrics();
  global.prometheusClientInitialized = true;
}

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2],
});

router.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = router;
```

### server.js
```js
const app = require('./index');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
```

### docker-compose.yml
```yaml
version: '3'

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - /etc/promtail:/etc/promtail
      - ./logs:/app/logs
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

### prometheus.yml
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['mongodb-exporter:9216']
```

### loki-config.yaml
```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  max_chunk_age: 1h
  chunk_target_size: 1048576
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2022-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /tmp/loki/index
    cache_location: /tmp/loki/cache
    shared_store: filesystem
  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

### promtail-config.yaml
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: node_logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: mern-app
          __path__: /app/logs/*.log
```

---

✅ You're now monitoring a MERN application with full observability: metrics, logs, and customizable dashboards!

