# New Relic Dashboard Configuration for Stellar Global Supplies AI

## Overview
This document provides a world-class New Relic dashboard configuration for monitoring the Gemini clone backend application. The dashboard covers application performance, database metrics, external API calls, user activity, and business insights.

## Prerequisites
- New Relic account with APM enabled
- New Relic license key configured in environment variables
- Application deployed with New Relic agent (already configured in `newrelic.cjs`)

---

## Dashboard Structure

### Dashboard Name: **Stellar AI - Production Monitoring**

---

## 1. Application Performance Overview

### Widget 1.1: Apdex Score
**Type:** Gauge
**NRQL:**
```sql
SELECT Apdex(apm.service.transaction.duration, threshold: 0.5) 
FROM Metric 
WHERE appName = 'stellar_ai' 
SINCE 5 minutes ago
```
**Purpose:** Measures user satisfaction with application response times (0-1 scale, target > 0.9)

### Widget 1.2: Response Time (Average)
**Type:** Line chart
**NRQL:**
```sql
SELECT average(apm.service.transaction.duration) 
FROM Metric 
WHERE appName = 'stellar_ai' 
FACET transactionName 
SINCE 30 minutes ago
```
**Purpose:** Monitor average response times across all API endpoints

### Widget 1.3: Throughput (Requests per Minute)
**Type:** Line chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
FACET transactionName 
SINCE 30 minutes ago
```
**Purpose:** Track request volume and identify traffic patterns

### Widget 1.4: Error Rate
**Type:** Line chart
**NRQL:**
```sql
SELECT percentage(count(*), WHERE error is true) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
SINCE 30 minutes ago
```
**Purpose:** Monitor application errors (target < 1%)

---

## 2. API Endpoint Performance

### Widget 2.1: Slowest Endpoints
**Type:** Bar chart
**NRQL:**
```sql
SELECT average(duration) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND transactionType = 'Web' 
FACET transactionName 
SINCE 1 hour ago 
LIMIT 10
```
**Purpose:** Identify performance bottlenecks

### Widget 2.2: Endpoint Error Distribution
**Type:** Pie chart
**NRQL:**
```sql
SELECT count(*) 
FROM TransactionError 
WHERE appName = 'stellar_ai' 
FACET error.class 
SINCE 1 hour ago
```
**Purpose:** Understand error types and frequency

### Widget 2.3: HTTP Status Codes
**Type:** Stacked bar chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
FACET http.statusCode 
SINCE 1 hour ago
```
**Purpose:** Monitor HTTP response codes (4xx, 5xx errors)

---

## 3. Database Performance

### Widget 3.1: Database Query Time
**Type:** Line chart
**NRQL:**
```sql
SELECT average(duration) 
FROM DatastoreStatement 
WHERE appName = 'stellar_ai' 
FACET statement 
SINCE 30 minutes ago
```
**Purpose:** Monitor database query performance

### Widget 3.2: Slow Database Queries
**Type:** Table
**NRQL:**
```sql
SELECT average(duration), max(duration), count(*) 
FROM DatastoreStatement 
WHERE appName = 'stellar_ai' 
FACET statement 
SINCE 1 hour ago 
ORDER BY average(duration) DESC
```
**Purpose:** Identify slow queries that need optimization

### Widget 3.3: Database Operations by Type
**Type:** Pie chart
**NRQL:**
```sql
SELECT count(*) 
FROM DatastoreStatement 
WHERE appName = 'stellar_ai' 
FACET datastoreOperation 
SINCE 1 hour ago
```
**Purpose:** Monitor SELECT, INSERT, UPDATE, DELETE operations

---

## 4. External API Monitoring

### Widget 4.1: External API Response Times
**Type:** Line chart
**NRQL:**
```sql
SELECT average(duration) 
FROM External 
WHERE appName = 'stellar_ai' 
FACET url 
SINCE 30 minutes ago
```
**Purpose:** Monitor Groq, Tavily, and Gradio API performance

### Widget 4.2: External API Error Rate
**Type:** Line chart
**NRQL:**
```sql
SELECT percentage(count(*), WHERE http.statusCode >= 400) 
FROM External 
WHERE appName = 'stellar_ai' 
FACET url 
SINCE 1 hour ago
```
**Purpose:** Track external API failures

### Widget 4.3: External API Call Volume
**Type:** Bar chart
**NRQL:**
```sql
SELECT count(*) 
FROM External 
WHERE appName = 'stellar_ai' 
FACET url 
SINCE 1 hour ago
```
**Purpose:** Monitor external API usage patterns

---

## 5. Authentication & Security

### Widget 5.1: Authentication Success Rate
**Type:** Line chart
**NRQL:**
```sql
SELECT percentage(count(*), WHERE request.parameters.operation = 'login' AND error is false) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND transactionName LIKE '%/api/auth%' 
SINCE 1 hour ago
```
**Purpose:** Monitor login success rates

### Widget 5.2: Failed Authentication Attempts
**Type:** Bar chart
**NRQL:**
```sql
SELECT count(*) 
FROM TransactionError 
WHERE appName = 'stellar_ai' 
AND transactionName LIKE '%/api/auth%' 
FACET error.message 
SINCE 1 hour ago
```
**Purpose:** Track authentication failures (potential security issues)

### Widget 5.3: Rate Limiting Hits
**Type:** Line chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND http.statusCode = 429 
SINCE 1 hour ago
```
**Purpose:** Monitor rate limiting effectiveness

---

## 6. User Activity & Business Metrics

### Widget 6.1: Active Users (Unique Sessions)
**Type:** Line chart
**NRQL:**
```sql
SELECT uniqueCount(session) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
SINCE 1 hour ago
```
**Purpose:** Track active user sessions

### Widget 6.2: Chat Messages per Minute
**Type:** Line chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND transactionName LIKE '%/api/chat%' 
SINCE 30 minutes ago
```
**Purpose:** Monitor chat feature usage

### Widget 6.3: Search Queries per Minute
**Type:** Line chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND transactionName LIKE '%/api/search%' 
SINCE 30 minutes ago
```
**Purpose:** Monitor search feature usage

### Widget 6.4: Image Generation Requests
**Type:** Line chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
AND transactionName LIKE '%/api/image%' 
SINCE 1 hour ago
```
**Purpose:** Track image generation feature usage

---

## 7. System Health

### Widget 7.1: Memory Usage
**Type:** Line chart
**NRQL:**
```sql
SELECT average(memory.heapUsed / 1024 / 1024) as 'Heap Used (MB)', 
       average(memory.heapTotal / 1024 / 1024) as 'Heap Total (MB)',
       average(memory.rss / 1024 / 1024) as 'RSS (MB)'
FROM Metric 
WHERE appName = 'stellar_ai' 
SINCE 30 minutes ago
```
**Purpose:** Monitor memory consumption

### Widget 7.2: Event Loop Lag
**Type:** Line chart
**NRQL:**
```sql
SELECT average(eventLoopTime) 
FROM Metric 
WHERE appName = 'stellar_ai' 
SINCE 30 minutes ago
```
**Purpose:** Monitor Node.js event loop performance

### Widget 7.3: CPU Usage
**Type:** Line chart
**NRQL:**
```sql
SELECT average(cpu.utilization) 
FROM Metric 
WHERE appName = 'stellar_ai' 
SINCE 30 minutes ago
```
**Purpose:** Monitor CPU utilization

---

## 8. Custom Insights & Business Events

### Widget 8.1: Feature Usage Distribution
**Type:** Bar chart
**NRQL:**
```sql
SELECT count(*) 
FROM Transaction 
WHERE appName = 'stellar_ai' 
FACET transactionName 
SINCE 24 hours ago
```
**Purpose:** Understand which features are most used

### Widget 8.2: Top Error Messages
**Type:** Table
**NRQL:**
```sql
SELECT count(*), latest(error.message) 
FROM TransactionError 
WHERE appName = 'stellar_ai' 
SINCE 1 hour ago 
GROUP BY error.message 
ORDER BY count(*) DESC 
LIMIT 10
```
**Purpose:** Identify most common errors

---

## Alert Conditions

### Critical Alerts

1. **High Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - NRQL: `SELECT percentage(count(*), WHERE error is true) FROM Transaction WHERE appName = 'stellar_ai'`

2. **Application Down**
   - Condition: No data received for 2 minutes
   - NRQL: `SELECT count(*) FROM Transaction WHERE appName = 'stellar_ai'`

3. **High Response Time**
   - Condition: Average response time > 3 seconds for 5 minutes
   - NRQL: `SELECT average(duration) FROM Transaction WHERE appName = 'stellar_ai'`

4. **Database Connection Issues**
   - Condition: Database errors > 10 in 5 minutes
   - NRQL: `SELECT count(*) FROM TransactionError WHERE appName = 'stellar_ai' AND error.class LIKE '%Database%'`

### Warning Alerts

1. **Elevated Error Rate**
   - Condition: Error rate > 2% for 10 minutes
   - NRQL: `SELECT percentage(count(*), WHERE error is true) FROM Transaction WHERE appName = 'stellar_ai'`

2. **Slow External API**
   - Condition: External API response time > 2 seconds
   - NRQL: `SELECT average(duration) FROM External WHERE appName = 'stellar_ai' AND url != ''`

3. **Memory Usage High**
   - Condition: Memory usage > 80% for 10 minutes
   - NRQL: `SELECT average(memory.heapUsed / memory.heapTotal * 100) FROM Metric WHERE appName = 'stellar_ai'`

---

## Custom Attributes (Add to newrelic.cjs)

To enhance the dashboard with more context, add these custom attributes to your `backend/newrelic.cjs`:

```javascript
attributes: {
  include: [
    'request.parameters.operation',
    'request.parameters.model',
    'request.parameters.userId',
    'request.parameters.sessionId',
    'request.headers.xForwardedFor',
  ],
  exclude: [
    'request.headers.cookie',
    'request.headers.authorization',
    'request.headers.setCookie',
  ],
},
```

---

## Custom Events (Add to application code)

Instrument your application with custom events for better insights:

```javascript
// Example: Track chat messages
import newrelic from 'newrelic';

// In your chat route handler
newrelic.addCustomAttributes({
  feature: 'chat',
  messageLength: message.length,
  hasAttachments: attachments.length > 0
});

// Example: Track search queries
newrelic.addCustomAttributes({
  feature: 'search',
  queryLength: query.length,
  resultsCount: results.length
});

// Example: Track image generation
newrelic.addCustomAttributes({
  feature: 'image_generation',
  model: modelName,
  promptLength: prompt.length
});
```

---

## Dashboard Setup Instructions

### Option 1: Manual Setup via New Relic UI

1. Log in to your New Relic account
2. Navigate to **APM & Services** → **stellar_ai**
3. Click on **Dashboards** tab
4. Click **Create dashboard**
5. Name it: "Stellar AI - Production Monitoring"
6. Add widgets using the NRQL queries above
7. Arrange widgets in a logical layout (performance at top, details below)
8. Set up alert conditions

### Option 2: Automated Setup via New Relic CLI

Install New Relic CLI:
```bash
npm install -g @newrelic/cli
```

Create a dashboard definition file `newrelic-dashboard.json`:
```json
{
  "title": "Stellar AI - Production Monitoring",
  "description": "World-class monitoring dashboard for Stellar Global Supplies AI",
  "pages": [
    {
      "name": "Overview",
      "widgets": [
        {
          "title": "Apdex Score",
          "visualization": "gauge",
          "nrql": "SELECT Apdex(apm.service.transaction.duration, threshold: 0.5) FROM Metric WHERE appName = 'stellar_ai' SINCE 5 minutes ago"
        },
        {
          "title": "Response Time",
          "visualization": "line_chart",
          "nrql": "SELECT average(apm.service.transaction.duration) FROM Metric WHERE appName = 'stellar_ai' FACET transactionName SINCE 30 minutes ago"
        }
      ]
    }
  ]
}
```

Import the dashboard:
```bash
newrelic dashboards create --file newrelic-dashboard.json
```

---

## Best Practices

1. **Review Dashboard Daily**: Check the dashboard during morning standups
2. **Set Up Alerts**: Configure critical alerts to be notified via Slack/email
3. **Regular Optimization**: Use slow query data to optimize database performance
4. **Capacity Planning**: Monitor trends to plan for scaling
5. **Error Analysis**: Review top errors weekly and fix root causes
6. **External Dependencies**: Monitor Groq/Tavily/Gradio API performance and have fallbacks

---

## Additional Resources

- [New Relic Node.js Agent Documentation](https://docs.newrelic.com/docs/agents/nodejs-agent/)
- [NRQL Documentation](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/)
- [Dashboard Best Practices](https://docs.newrelic.com/docs/query-your-data/explore-nerddata/dashboards/dashboards-best-practices/)
- [Alert Conditions](https://docs.newrelic.com/docs/alerts-applied-intelligence/new-relic-alerts/alert-conditions/alert-conditions-create-or-edit/)

---

## Support

For issues with New Relic configuration, refer to:
- `backend/newrelic.cjs` - Agent configuration
- `backend/.env.example` - Environment variables
- New Relic support: https://support.newrelic.com/