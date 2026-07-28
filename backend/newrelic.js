'use strict';

/**
 * New Relic agent configuration for EU region
 *
 * See: https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 */

exports.config = {
  /**
   * Array of application names.
   * Can be set via NEW_RELIC_APP_NAME environment variable.
   */
  app_name: process.env.NEW_RELIC_APP_NAME || ['Stellar AI Backend'],
  
  /**
   * Your New Relic license key (set in environment variable).
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  
  /**
   * Sampling configuration - 100% sampling for 2 users
   */
  sampling: {
    rate: 1.0,  // 100% of transactions
  },
  
  /**
   * Logging configuration.
   */
  logging: {
    level: 'info',
  },
  
  /**
   * Distributed tracing configuration.
   */
  distributed_tracing: {
    enabled: true,
  },
  
  /**
   * EU-specific OTLP endpoint
   */
  otlp: {
    endpoint: 'https://otlp.eu.newrelic.com:4318/v1/traces',
  },
  
  /**
   * Attribute filtering - exclude sensitive data
   */
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.setCookie',
    ],
  },
  
  /**
   * Slow SQL tracking.
   */
  slow_sql: {
    enabled: true,
    threshold: 500,
  },
  
  /**
   * Don't send stack traces for non-error transactions to reduce data volume.
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 0,  // Trace all transactions
    record_sql: 'obfuscated',
    stack_trace_threshold: 500,
  },
};