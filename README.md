# Advanced Monitoring for MERN Application with Grafana and Prometheus

## ✨ Objective
Build a complete monitoring system for a MERN application using Prometheus, Grafana, and tracing/logging tools. This will cover frontend, backend, and database layers and provide observability into application health and performance.

---

## 📁 Project Structure
```
mern-monitoring/
├── backend/                        # Node.js backend
├── frontend/                       # React frontend
├── prometheus/
│   └── prometheus.yml             # Prometheus configuration
├── grafana/                       # Dashboards and config
├── exporters/
│   └── mongodb-exporter/          # MongoDB Exporter setup
├── loki/                          # Log aggregation config
├── tracing/
│   ├── jaeger/                    # Jaeger setup
├── docker-compose.yml             # Full monitoring stack
├── README.md                      # Documentation
```

---

## ✅ Step-by-Step Setup

### 1. Deploy Travel Memory MERN Application Locally
- Clone: https://github.com/UnpredictablePrashant/TravelMemory
- Backend:
  ```bash
  cd backend
  npm install
  npm start
  ```
- Frontend:
  ```bash
  cd frontend
  npm install
  npm start
  ```
- MongoDB: Use local MongoDB or container via Docker.

### 2. Integrate Prometheus in Backend
- Install Prometheus client:
  ```bash
  npm install prom-client
  ```
- In `index.js`, add:
  ```js
  const client = require('prom-client');
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
  ```

### 3. MongoDB Exporter Setup
- Pull exporter:
  ```bash
  docker run -d -p 9216:9216 --name mongodb-exporter --network host -e MONGODB_URI=mongodb://localhost:27017 bitnami/mongodb-exporter
  ```

### 4. Configure Prometheus
- `prometheus/prometheus.yml`:
  ```yaml
  global:
    scrape_interval: 10s

  scrape_configs:
    - job_name: 'node-backend'
      static_configs:
        - targets: ['localhost:3001']

    - job_name: 'mongodb'
      static_configs:
        - targets: ['localhost:9216']
  ```

### 5. Run Prometheus & Grafana
```bash
docker-compose up -d
```

### 6. Grafana Dashboards
- Default credentials: `admin/admin`
- Add Prometheus as a data source
- Import dashboards:
  - Node.js metrics dashboard
  - MongoDB performance
  - Create custom dashboard for request counts, response time

### 7. Log Aggregation with Loki
- Run Loki and Promtail (in `docker-compose.yml`)
- Forward backend logs to `/var/log/app.log`
- In Promtail config:
```yaml
  static_configs:
    - targets:
        - localhost
      labels:
        job: backend-logs
        __path__: /var/log/app.log
```
- Connect Loki to Grafana and create a log panel.

### 8. Distributed Tracing with Jaeger
- Install OpenTelemetry SDK:
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-jaeger
```
- Configure Jaeger exporter in backend:
```js
const { NodeTracerProvider } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new JaegerExporter({
  serviceName: 'node-backend'
})));
provider.register();
```

- Launch Jaeger UI (http://localhost:16686) to view traces.

### 9. Alerts and Anomaly Detection
- In Grafana:
  - Go to Alerting > New Alert Rule
  - Example: if request duration > 1s for 5 minutes, trigger alert
- Optional: Add email/Slack notifications

---

