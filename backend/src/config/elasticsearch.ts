import { Client } from '@elastic/elasticsearch';
import config from './index';

/**
 * Elasticsearch client instance
 */
export const esClient = new Client({
  node: config.elasticsearch.host,
  requestTimeout: config.elasticsearch.timeout,
  maxRetries: 3,
});

/**
 * Test Elasticsearch connection
 */
export async function testElasticsearchConnection(): Promise<boolean> {
  try {
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch connection successful');
    console.log(`   Status: ${health.status}`);
    console.log(`   Cluster: ${health.cluster_name}`);
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error);
    return false;
  }
}

/**
 * Verify index exists
 */
export async function verifyIndex(): Promise<boolean> {
  try {
    const exists = await esClient.indices.exists({
      index: config.elasticsearch.index,
    });

    if (exists) {
      console.log(`✅ Index '${config.elasticsearch.index}' verified`);

      // Get index stats
      const stats = await esClient.count({
        index: config.elasticsearch.index,
      });
      console.log(`   Documents: ${stats.count}`);
      return true;
    } else {
      console.error(`❌ Index '${config.elasticsearch.index}' not found`);
      return false;
    }
  } catch (error) {
    console.error('❌ Index verification failed:', error);
    return false;
  }
}

/**
 * Initialize Elasticsearch connection and verify setup
 */
export async function initializeElasticsearch(): Promise<void> {
  console.log('\n🔍 Initializing Elasticsearch connection...\n');

  const connected = await testElasticsearchConnection();
  if (!connected) {
    throw new Error('Failed to connect to Elasticsearch');
  }

  const indexVerified = await verifyIndex();
  if (!indexVerified) {
    throw new Error(`Index '${config.elasticsearch.index}' not found or inaccessible`);
  }

  console.log('\n✅ Elasticsearch initialization complete\n');
}

export default esClient;
