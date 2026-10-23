/**
 * Second pass at icon coverage, this time with an alias map.
 *
 * Our catalog names are written for humans ("AWS", "MongoDB Atlas"), while
 * simple-icons titles are the full brand name ("Amazon Web Services",
 * "MongoDB"). Exact matching therefore understates coverage badly, so this
 * script maps each product to the icon it actually represents.
 *
 * Run with: npx tsx scripts/check-icon-coverage.ts
 */
import { PRODUCTS } from '../src/catalog/index';
import * as si from 'simple-icons';

// The package is CommonJS, so the ESM namespace may expose the icon map as
// `default` or flatten it into the namespace. Accept either shape.
const ns = si as unknown as Record<string, unknown>;
const all = (ns.default && typeof ns.default === 'object' ? ns.default : ns) as Record<
  string,
  { title?: string; slug?: string }
>;

const byTitle = new Map<string, string>();
for (const [slug, icon] of Object.entries(all)) {
  const title = icon?.title;
  if (title) byTitle.set(normalise(title), slug);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

/**
 * Catalog name -> simple-icons title. Only entries that differ from the catalog
 * name are listed, so this stays readable and reviewable.
 */
const ALIASES: Record<string, string> = {
  AWS: 'Amazon Web Services',
  'Microsoft Azure': 'Microsoft Azure',
  'MongoDB Atlas': 'MongoDB',
  CockroachDB: 'Cockroach Labs',
  BigQuery: 'Google BigQuery',
  'Grafana Cloud': 'Grafana',
  'Splunk Observability': 'Splunk',
  'Elastic (ELK)': 'Elastic',
  'Atlassian Statuspage': 'Atlassian',
  'PayPal and Braintree': 'PayPal',
  'Firebase Cloud Messaging': 'Firebase',
  'Amazon SQS and SNS': 'Amazon SQS',
  'Amazon SES': 'Amazon SES',
  'Amazon Cognito': 'Amazon Cognito',
  'Google Vertex AI': 'Google Vertex AI',
  'AWS Bedrock': 'Amazon Bedrock',
  'Amazon DynamoDB': 'Amazon DynamoDB',
};

const covered: { name: string; slug: string }[] = [];
const missing: string[] = [];

for (const product of PRODUCTS) {
  const candidates = [product.name, ALIASES[product.name]].filter(Boolean) as string[];
  const slug = candidates.map(normalise).map((c) => byTitle.get(c)).find(Boolean);
  if (slug) {
    covered.push({ name: product.name, slug });
  } else {
    missing.push(product.name);
  }
}

console.log(`products: ${PRODUCTS.length}`);
console.log(`covered:  ${covered.length} (${((covered.length / PRODUCTS.length) * 100).toFixed(1)}%)`);
console.log(`missing:  ${missing.length}`);
console.log('');
console.log('still missing:');
for (const name of missing) console.log('  -', name);
