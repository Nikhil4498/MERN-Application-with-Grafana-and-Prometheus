## Travel Memory MERN Application – Advanced Monitoring Setup

This project enhances a MERN (MongoDB, Express, React, Node.js) application with **advanced observability tools**:

- Real-time metrics via **Prometheus**
- Interactive dashboards in **Grafana**
- Database monitoring using **MongoDB Exporter**
- Log aggregation using **Loki + Promtail**
- Alerting (Grafana) and Distributed Tracing (optional)

## Step-by-Step Setup Guide

File Structure:
📁 travel-memory-monitoring/
├── 📁 backend/
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


Step 1: Clone the Project

		bash
		git clone https://github.com/your-username/travel-memory-monitoring.git
		cd travel-memory-monitoring
  
Step 2: Start the Backend

		cd backend
		npm install

		Create a .env file:
  
      .env
        		PORT=3001
        		MONGO_URI=mongodb://localhost:27017/TravelMemory-Mern
		
    Start the server:

      		npm run dev
        
      		      # Your backend runs at: http://localhost:3001
      		      # Prometheus metrics available at: http://localhost:3001/metrics

![image](https://github.com/user-attachments/assets/26c89a41-e80c-4fcc-a387-0ffb738a93e6)

![image](https://github.com/user-attachments/assets/4cd71b1a-d8cf-4a1e-8a1c-7e0b1f68fd77)

![image](https://github.com/user-attachments/assets/ef13714d-7d77-445d-821d-4661dcdf95c9)




Step 3: Start the Monitoring Stack with Docker
		# From the project root, run:

		docker-compose up -d   		#This will start: MongoDB, MongoDB Exporter,Prometheus,Grafana,Loki,Promtail

![image](https://github.com/user-attachments/assets/61f07cbd-dc47-4fa5-a6a0-7b588dc8cbd1)

![image](https://github.com/user-attachments/assets/cb1fecee-c6e9-46f5-8515-ec9897931fe8)



Step 4: Access Grafana

        URL: http://localhost:3000
        
        		Login: admin / admin

        		Add Loki & Prometheus as data sources (if not auto-configured)
        
        		Prometheus Metrics
          
        		Default Node.js metrics (CPU, memory, GC)
        
        		Custom Express route metrics: http_request_duration_seconds
        
        		MongoDB metrics via mongodb-exporter

![image](https://github.com/user-attachments/assets/fbdd966a-edb4-48b3-9ae5-7bb89c8359ae)


Step 5: Add Loki in Grafana
          Go to http://localhost:3000

          Login → Admin / admin

          Go to Settings → Data Sources

          Click “Add data source”

          Select Loki

        Set URL: http://loki:3100
        Save & Test               #Should say: Data source is working

![image](https://github.com/user-attachments/assets/ec9e1797-c50a-45e3-aa46-98b9c48a3403)

		
# API Routes:

Method	  Endpoint  	Description
GET	      /hello	    Health check
GET	      /trip	      Fetch all trips
POST	    /trip	      Add a new trip
GET	      /metrics	   Prometheus metrics scrape

![image](https://github.com/user-attachments/assets/a1d45ca9-bb6f-4e7f-81be-db2992d0aeb1)


# Features:
Track CPU, memory, and event loop performance

Analyze HTTP request durations

Monitor MongoDB health & performance

Aggregate logs via Promtail & Loki

Explore metrics and logs in Grafana

Setup alerts and distributed tracing (optional)
  
## Key  Files (with Code)
(a) conn.js
          js
          
          const mongoose = require('mongoose');
          require('dotenv').config();
          
          mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/TravelMemory-Mern', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
          .then(() => console.log('✅ MongoDB connected successfully'))
          .catch(err => console.error('❌ MongoDB connection error:', err));
          
          module.exports = mongoose;
          
(b) logger.js
          js
          
          const winston = require('winston');
          const path = require('path');
          
          const logger = winston.createLogger({
            transports: [
              new winston.transports.File({ filename: path.join(__dirname, 'logs', 'app.log') }),
            ],
          });
          
          module.exports = logger;
          
(c) metrics.js
          js
         
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
          
(d) server.js
        js
       
        const app = require('./index');
        const PORT = process.env.PORT || 3001;
        
        app.listen(PORT, () => {
          console.log(`Server started at http://localhost:${PORT}`);
        });


(e) docker-compose.yml

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
                    - ./logs:/app/logs # Your app's logs
                  command: -config.file=/etc/promtail/config.yml
              
                grafana:
                  image: grafana/grafana:latest
                  ports:
                    - "3000:3000"
                  volumes:
                    - grafana-storage:/var/lib/grafana
              
              volumes:
                grafana-storage:

(f) prometheus.yml

        global:
        scrape_interval: 15s
      
        scrape_configs:
          - job_name: 'prometheus'
            static_configs:
              - targets: ['localhost:9090']
      
        - job_name: 'mongodb-exporter'
          static_configs:
            - targets: ['mongodb-exporter:9216']


(g) loki-config.yaml

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


(h) promtail-config.yaml

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



  


