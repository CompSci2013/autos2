# Kibana Reference Guide - Autos2 Project

**Last Updated**: 2025-10-25
**Elasticsearch Version**: 8.x
**Kibana Version**: 8.x

---

## Table of Contents

1. [Access Information](#access-information)
2. [Index Overview](#index-overview)
3. [Quick Start Guide](#quick-start-guide)
4. [Data Exploration](#data-exploration)
5. [Common Queries](#common-queries)
6. [Troubleshooting](#troubleshooting)

---

## Access Information

### URLs

**External Access (from your network):**
```
http://kibana.minilab
http://192.168.0.110:30561
http://192.168.0.244:30561
```

**Internal Kubernetes Access:**
```
http://kibana.data.svc.cluster.local:5601
```

### Deployment Details

```yaml
Namespace: data
Service Name: kibana
Service Type: ClusterIP + NodePort
Port: 5601 (ClusterIP)
NodePort: 30561
Pod: kibana-f69765944-pnlmq
Status: Running
```

---

## Index Overview

### Autos2 Index: `autos-unified`

**Index Statistics:**
```
Name: autos-unified
Status: 🟢 Green (healthy)
Documents: 793
Size: 171.1 KB
Shards: 1 primary, 0 replicas
```

**Data Source:**
- NHTSA VPIC dataset (large sample)
- Ingested: 2025-10-12

### Index Mapping

```json
{
  "autos-unified": {
    "mappings": {
      "properties": {
        "vehicle_id": {
          "type": "keyword"
        },
        "manufacturer": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "analyzer": "vehicle_analyzer"
        },
        "model": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "analyzer": "vehicle_analyzer"
        },
        "year": {
          "type": "integer"
        },
        "vin": {
          "type": "keyword"
        },
        "body_class": {
          "type": "keyword"
        },
        "body_style": {
          "type": "keyword"
        },
        "drive_type": {
          "type": "keyword"
        },
        "engine_cylinders": {
          "type": "integer"
        },
        "engine_displacement_l": {
          "type": "float"
        },
        "engine_hp": {
          "type": "integer"
        },
        "engine_type": {
          "type": "keyword"
        },
        "transmission_speeds": {
          "type": "integer"
        },
        "transmission_type": {
          "type": "keyword"
        },
        "data_source": {
          "type": "keyword"
        },
        "ingested_at": {
          "type": "date"
        }
      }
    }
  }
}
```

### Field Reference

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `vehicle_id` | keyword | Unique vehicle identifier | `"nhtsa-ford-crown-victoria-1953"` |
| `manufacturer` | text + keyword | Vehicle manufacturer (searchable + aggregatable) | `"Ford"` |
| `model` | text + keyword | Vehicle model name | `"Crown Victoria"` |
| `year` | integer | Manufacturing year | `1953` |
| `vin` | keyword | Vehicle Identification Number | `"1FAFP40411F100001"` |
| `body_class` | keyword | Body classification | `"Sedan"`, `"Pickup"`, `"SUV"` |
| `body_style` | keyword | Body style | `"4-Door Sedan"` |
| `drive_type` | keyword | Drive train type | `"FWD"`, `"RWD"`, `"4WD"` |
| `engine_cylinders` | integer | Number of cylinders | `6`, `8` |
| `engine_displacement_l` | float | Engine size in liters | `3.5`, `5.0` |
| `engine_hp` | integer | Horsepower | `150`, `300` |
| `engine_type` | keyword | Engine type | `"V6"`, `"V8"`, `"I4"` |
| `transmission_speeds` | integer | Number of transmission speeds | `6`, `8`, `10` |
| `transmission_type` | keyword | Transmission type | `"Automatic"`, `"Manual"` |
| `data_source` | keyword | Data source identifier | `"nhtsa_vpic_large_sample"` |
| `ingested_at` | date | When data was ingested | `"2025-10-12T23:22:19.933382"` |

### Sample Document

```json
{
  "vehicle_id": "nhtsa-ford-crown-victoria-1953",
  "manufacturer": "Ford",
  "model": "Crown Victoria",
  "year": 1953,
  "vin": "1FAFP40411F100001",
  "body_class": "Unknown",
  "body_style": null,
  "drive_type": null,
  "engine_cylinders": null,
  "engine_displacement_l": null,
  "engine_hp": null,
  "engine_type": null,
  "transmission_speeds": null,
  "transmission_type": null,
  "data_source": "nhtsa_vpic_large_sample",
  "ingested_at": "2025-10-12T23:22:19.933382"
}
```

---

## Quick Start Guide

### 1. Create Data View (First Time Only)

1. Open Kibana: **http://kibana.minilab**
2. Click hamburger menu (☰) → **Stack Management**
3. Navigate to **Kibana** → **Data Views**
4. Click **"Create data view"**
5. Configure:
   - **Name**: `Autos2 - Unified`
   - **Index pattern**: `autos-unified`
   - **Timestamp field**: `ingested_at` (or "I don't want to use a time field")
6. Click **"Save data view to Kibana"**

### 2. Explore Data in Discover

1. Menu (☰) → **Analytics** → **Discover**
2. Select data view: `autos-unified`
3. You should see 793 documents
4. Adjust time range if needed (top right)

### 3. View Index Mappings

**Option A: Via Stack Management**
1. Menu (☰) → **Stack Management**
2. **Index Management** → Find `autos-unified`
3. Click on index name → **Mappings** tab

**Option B: Via Dev Tools**
1. Menu (☰) → **Dev Tools**
2. Run:
```
GET /autos-unified/_mapping
```

### 4. Check Index Health

**Via Stack Management:**
1. Menu (☰) → **Stack Management** → **Index Management**
2. Look for `autos-unified` - should show 🟢 green health

**Via Dev Tools:**
```
GET /_cat/indices/autos-unified?v
```

---

## Data Exploration

### Using Discover

**Filter by Manufacturer:**
1. In Discover, click **"+ Add filter"**
2. Field: `manufacturer.keyword`
3. Operator: `is`
4. Value: `Ford` (or any manufacturer)
5. Click **Save**

**Filter by Year Range:**
1. Click **"+ Add filter"**
2. Field: `year`
3. Operator: `is between`
4. Values: `1950` to `1960`
5. Click **Save**

**View Specific Fields Only:**
1. In left sidebar, hover over field name
2. Click the **"+"** icon to add to table
3. Common fields to add:
   - `manufacturer`
   - `model`
   - `year`
   - `body_class`
   - `vin`

### Creating Visualizations

**Pie Chart - Vehicles by Manufacturer:**
1. Menu (☰) → **Analytics** → **Visualize Library**
2. Click **"Create visualization"**
3. Select **Pie** chart type
4. Select data view: `autos-unified`
5. Configure:
   - **Slice by**: Terms → Field: `manufacturer.keyword` → Size: 10
6. Click **Save**

**Bar Chart - Vehicles by Year:**
1. Create visualization → **Bar** (vertical)
2. Configure:
   - **Horizontal axis**: Histogram → Field: `year` → Interval: 1
   - **Vertical axis**: Count
3. Click **Save**

---

## Common Queries

### Dev Tools Query Examples

Access: Menu (☰) → **Dev Tools**

#### 1. Count All Documents

```json
GET /autos-unified/_count
```

#### 2. Get All Manufacturers (Aggregation)

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100
      }
    }
  }
}
```

#### 3. Search for Ford Vehicles

```json
GET /autos-unified/_search
{
  "query": {
    "match": {
      "manufacturer": "Ford"
    }
  },
  "size": 20
}
```

#### 4. Filter by Year Range

```json
GET /autos-unified/_search
{
  "query": {
    "range": {
      "year": {
        "gte": 1950,
        "lte": 1960
      }
    }
  }
}
```

#### 5. Get Models for a Manufacturer

```json
GET /autos-unified/_search
{
  "query": {
    "term": {
      "manufacturer.keyword": "Ford"
    }
  },
  "size": 0,
  "aggs": {
    "models": {
      "terms": {
        "field": "model.keyword",
        "size": 100
      }
    }
  }
}
```

#### 6. Count by Body Class

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "body_classes": {
      "terms": {
        "field": "body_class",
        "size": 50
      }
    }
  }
}
```

#### 7. Complex Multi-Filter Search

```json
GET /autos-unified/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "manufacturer.keyword": "Ford" } },
        { "range": { "year": { "gte": 1950, "lte": 1970 } } }
      ],
      "must_not": [
        { "term": { "body_class": "Unknown" } }
      ]
    }
  },
  "size": 100,
  "sort": [
    { "year": "asc" },
    { "model.keyword": "asc" }
  ]
}
```

#### 8. Get Statistics on Year Field

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "year_stats": {
      "stats": {
        "field": "year"
      }
    }
  }
}
```

---

## Troubleshooting

### Kibana Not Loading

**Check Pod Status:**
```bash
kubectl get pods -n data | grep kibana
```

**Expected Output:**
```
kibana-f69765944-pnlmq   1/1   Running   0   1h
```

**Check Logs:**
```bash
kubectl logs -n data deployment/kibana --tail=50
```

### Can't See autos-unified Index

**Verify Index Exists:**
```bash
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/_cat/indices?v | grep autos
```

**Should show:**
```
green  open   autos-unified     gGxVvZ1xQ2qc6sS6EjpVKg   1   0   793   0   171.1kb   171.1kb
```

**If missing, check if data was loaded:**
```bash
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/autos-unified/_count
```

### Data View Not Showing Documents

1. **Check time range** - Click time picker (top right) → Select "Last 15 years" or broader range
2. **Refresh data view** - Stack Management → Data Views → Select `autos-unified` → Refresh fields
3. **Check filters** - Remove any active filters in Discover

### Elasticsearch Connection Issues

**Test Elasticsearch Health:**
```bash
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/_cluster/health?pretty
```

**Should show:**
```json
{
  "cluster_name" : "elasticsearch",
  "status" : "green",
  "number_of_nodes" : 1
}
```

**From Autos2 Backend:**
```bash
kubectl exec -n autos2 deployment/autos2-backend -- \
  curl -s http://elasticsearch.data.svc.cluster.local:9200/_cluster/health
```

---

## Quick Reference Commands

### Cluster Commands

```bash
# Check Kibana pod
kubectl get pod -n data -l app=kibana

# View Kibana logs
kubectl logs -n data deployment/kibana --tail=50 -f

# Restart Kibana
kubectl rollout restart deployment/kibana -n data

# Port forward (alternative access)
kubectl port-forward -n data svc/kibana 5601:5601
# Then access: http://localhost:5601
```

### Elasticsearch Commands

```bash
# List all indices
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/_cat/indices?v

# Get index mapping
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/autos-unified/_mapping | jq '.'

# Count documents
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/autos-unified/_count | jq '.'

# Get sample document
kubectl exec -n data deployment/elasticsearch -- \
  curl -s 'http://localhost:9200/autos-unified/_search?size=1&pretty'

# Get cluster health
kubectl exec -n data deployment/elasticsearch -- \
  curl -s http://localhost:9200/_cluster/health?pretty
```

---

## Integration with Autos2 Application

### Backend Connection

The Autos2 backend connects to Elasticsearch at:
```
http://elasticsearch.data.svc.cluster.local:9200
Index: autos-unified
```

**Environment Variables** (in `k8s/backend-deployment.yaml`):
```yaml
env:
  - name: ELASTICSEARCH_URL
    value: http://elasticsearch.data.svc.cluster.local:9200
  - name: ELASTICSEARCH_INDEX
    value: autos-unified
```

### Comparing API Results with Kibana

**Backend API Stats:**
```bash
curl http://autos2.minilab/api/v1/stats | jq '.'
```

**Equivalent Kibana Query (Dev Tools):**
```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "total_vehicles": { "value_count": { "field": "_id" } },
    "manufacturers": { "cardinality": { "field": "manufacturer.keyword" } },
    "models": { "cardinality": { "field": "model.keyword" } },
    "year_range": { "stats": { "field": "year" } }
  }
}
```

---

## Additional Resources

### Elasticsearch Documentation
- Query DSL: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
- Aggregations: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html

### Kibana Documentation
- Discover Guide: https://www.elastic.co/guide/en/kibana/current/discover.html
- Visualizations: https://www.elastic.co/guide/en/kibana/current/dashboard.html

---

**Document Version**: 1.0
**Created**: 2025-10-25
**Author**: Claude + Odin
**Related Documents**:
- [CLAUDE.md](CLAUDE.md) - Main onboarding reference
- [Shutdown/Startup Procedures](shutdown-startup-procedures.md) - Lab management
