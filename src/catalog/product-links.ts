/**
 * Outbound links for each product, keyed by product id.
 *
 * Two links per product, because they serve different purposes in a learning
 * tool: `docs` is where you learn the thing, `site` is where you sign up and see
 * pricing. The detail panel shows both, so reading about a product and starting
 * to use it are one click apart.
 *
 * Kept out of the generated products.ts for the same reason as brand-icons.ts:
 * the catalog is derived from the legacy source, while these are curated by hand
 * and reviewed as a set.
 *
 * A link is only present where it is the vendor's own canonical page. Where a
 * product has no separate docs site, `docs` points at the docs root rather than
 * a deep path that may have moved.
 */
export interface ProductLinks {
  docs: string;
  site: string;
}

export const PRODUCT_LINKS: Record<string, ProductLinks> = {
  // --- Cloud infrastructure ---
  aws: { docs: 'https://docs.aws.amazon.com/', site: 'https://aws.amazon.com/' },
  'google-cloud': { docs: 'https://cloud.google.com/docs', site: 'https://cloud.google.com/' },
  'microsoft-azure': { docs: 'https://learn.microsoft.com/azure/', site: 'https://azure.microsoft.com/' },
  digitalocean: { docs: 'https://docs.digitalocean.com/', site: 'https://www.digitalocean.com/' },
  hetzner: { docs: 'https://docs.hetzner.com/', site: 'https://www.hetzner.com/' },
  cloudflare: { docs: 'https://developers.cloudflare.com/', site: 'https://www.cloudflare.com/' },
  'fly-io': { docs: 'https://fly.io/docs/', site: 'https://fly.io/' },

  // --- App hosting and deploy platforms ---
  vercel: { docs: 'https://vercel.com/docs', site: 'https://vercel.com/' },
  netlify: { docs: 'https://docs.netlify.com/', site: 'https://www.netlify.com/' },
  render: { docs: 'https://render.com/docs', site: 'https://render.com/' },
  railway: { docs: 'https://docs.railway.com/', site: 'https://railway.com/' },
  heroku: { docs: 'https://devcenter.heroku.com/', site: 'https://www.heroku.com/' },

  // --- Databases and data stores ---
  postgresql: { docs: 'https://www.postgresql.org/docs/', site: 'https://www.postgresql.org/' },
  supabase: { docs: 'https://supabase.com/docs', site: 'https://supabase.com/' },
  neon: { docs: 'https://neon.com/docs', site: 'https://neon.com/' },
  planetscale: { docs: 'https://planetscale.com/docs', site: 'https://planetscale.com/' },
  'mongodb-atlas': { docs: 'https://www.mongodb.com/docs/atlas/', site: 'https://www.mongodb.com/atlas' },
  'amazon-dynamodb': { docs: 'https://docs.aws.amazon.com/dynamodb/', site: 'https://aws.amazon.com/dynamodb/' },
  redis: { docs: 'https://redis.io/docs/', site: 'https://redis.io/' },
  cockroachdb: { docs: 'https://www.cockroachlabs.com/docs/', site: 'https://www.cockroachlabs.com/' },
  turso: { docs: 'https://docs.turso.tech/', site: 'https://turso.tech/' },

  // --- Data warehouse and pipelines ---
  snowflake: { docs: 'https://docs.snowflake.com/', site: 'https://www.snowflake.com/' },
  bigquery: { docs: 'https://cloud.google.com/bigquery/docs', site: 'https://cloud.google.com/bigquery' },
  databricks: { docs: 'https://docs.databricks.com/', site: 'https://www.databricks.com/' },
  clickhouse: { docs: 'https://clickhouse.com/docs', site: 'https://clickhouse.com/' },
  dbt: { docs: 'https://docs.getdbt.com/', site: 'https://www.getdbt.com/' },
  fivetran: { docs: 'https://fivetran.com/docs', site: 'https://fivetran.com/' },
  airbyte: { docs: 'https://docs.airbyte.com/', site: 'https://airbyte.com/' },

  // --- Observability and monitoring ---
  datadog: { docs: 'https://docs.datadoghq.com/', site: 'https://www.datadoghq.com/' },
  'new-relic': { docs: 'https://docs.newrelic.com/', site: 'https://newrelic.com/' },
  'grafana-cloud': { docs: 'https://grafana.com/docs/', site: 'https://grafana.com/' },
  dynatrace: { docs: 'https://docs.dynatrace.com/', site: 'https://www.dynatrace.com/' },
  'splunk-observability': { docs: 'https://docs.splunk.com/Observability', site: 'https://www.splunk.com/' },
  honeycomb: { docs: 'https://docs.honeycomb.io/', site: 'https://www.honeycomb.io/' },
  chronosphere: { docs: 'https://docs.chronosphere.io/', site: 'https://chronosphere.io/' },
  'elastic-elk': { docs: 'https://www.elastic.co/guide/', site: 'https://www.elastic.co/' },
  'better-stack': { docs: 'https://betterstack.com/docs', site: 'https://betterstack.com/' },
  prometheus: { docs: 'https://prometheus.io/docs/', site: 'https://prometheus.io/' },
  opentelemetry: { docs: 'https://opentelemetry.io/docs/', site: 'https://opentelemetry.io/' },
  signoz: { docs: 'https://signoz.io/docs/', site: 'https://signoz.io/' },

  // --- Error tracking and product analytics ---
  sentry: { docs: 'https://docs.sentry.io/', site: 'https://sentry.io/' },
  posthog: { docs: 'https://posthog.com/docs', site: 'https://posthog.com/' },
  mixpanel: { docs: 'https://docs.mixpanel.com/', site: 'https://mixpanel.com/' },
  amplitude: { docs: 'https://amplitude.com/docs', site: 'https://amplitude.com/' },
  logrocket: { docs: 'https://docs.logrocket.com/', site: 'https://logrocket.com/' },
  segment: { docs: 'https://segment.com/docs/', site: 'https://segment.com/' },

  // --- Incident response and status ---
  pagerduty: { docs: 'https://www.pagerduty.com/docs/', site: 'https://www.pagerduty.com/' },
  'incident-io': { docs: 'https://docs.incident.io/', site: 'https://incident.io/' },
  'atlassian-statuspage': { docs: 'https://support.atlassian.com/statuspage/', site: 'https://www.atlassian.com/software/statuspage' },
  opsgenie: { docs: 'https://support.atlassian.com/opsgenie/', site: 'https://www.atlassian.com/software/opsgenie' },

  // --- Realtime and messaging infrastructure ---
  pubnub: { docs: 'https://www.pubnub.com/docs', site: 'https://www.pubnub.com/' },
  ably: { docs: 'https://ably.com/docs', site: 'https://ably.com/' },
  pusher: { docs: 'https://pusher.com/docs', site: 'https://pusher.com/' },
  liveblocks: { docs: 'https://liveblocks.io/docs', site: 'https://liveblocks.io/' },
  stream: { docs: 'https://getstream.io/chat/docs/', site: 'https://getstream.io/' },
  sendbird: { docs: 'https://sendbird.com/docs', site: 'https://sendbird.com/' },
  'socket-io': { docs: 'https://socket.io/docs/', site: 'https://socket.io/' },
  centrifugo: { docs: 'https://centrifugal.dev/', site: 'https://centrifugal.dev/' },

  // --- Message queues and event streaming ---
  'apache-kafka': { docs: 'https://kafka.apache.org/documentation/', site: 'https://kafka.apache.org/' },
  confluent: { docs: 'https://docs.confluent.io/', site: 'https://www.confluent.io/' },
  redpanda: { docs: 'https://docs.redpanda.com/', site: 'https://redpanda.com/' },
  rabbitmq: { docs: 'https://www.rabbitmq.com/docs', site: 'https://www.rabbitmq.com/' },
  nats: { docs: 'https://docs.nats.io/', site: 'https://nats.io/' },
  'amazon-sqs-and-sns': { docs: 'https://docs.aws.amazon.com/AWSSimpleQueueService/', site: 'https://aws.amazon.com/sqs/' },
  'google-pub-sub': { docs: 'https://cloud.google.com/pubsub/docs', site: 'https://cloud.google.com/pubsub' },

  // --- Workflow and background jobs ---
  temporal: { docs: 'https://docs.temporal.io/', site: 'https://temporal.io/' },
  inngest: { docs: 'https://www.inngest.com/docs', site: 'https://www.inngest.com/' },
  'trigger-dev': { docs: 'https://trigger.dev/docs', site: 'https://trigger.dev/' },
  'apache-airflow': { docs: 'https://airflow.apache.org/docs/', site: 'https://airflow.apache.org/' },
  dagster: { docs: 'https://docs.dagster.io/', site: 'https://dagster.io/' },
  prefect: { docs: 'https://docs.prefect.io/', site: 'https://www.prefect.io/' },

  // --- Communications APIs ---
  twilio: { docs: 'https://www.twilio.com/docs', site: 'https://www.twilio.com/' },
  vonage: { docs: 'https://developer.vonage.com/', site: 'https://www.vonage.com/' },
  sinch: { docs: 'https://developers.sinch.com/', site: 'https://sinch.com/' },
  telnyx: { docs: 'https://developers.telnyx.com/', site: 'https://telnyx.com/' },
  bird: { docs: 'https://docs.bird.com/', site: 'https://bird.com/' },
  daily: { docs: 'https://docs.daily.co/', site: 'https://www.daily.co/' },
  livekit: { docs: 'https://docs.livekit.io/', site: 'https://livekit.io/' },
  agora: { docs: 'https://docs.agora.io/', site: 'https://www.agora.io/' },

  // --- Email and notifications ---
  'amazon-ses': { docs: 'https://docs.aws.amazon.com/ses/', site: 'https://aws.amazon.com/ses/' },
  sendgrid: { docs: 'https://www.twilio.com/docs/sendgrid', site: 'https://sendgrid.com/' },
  postmark: { docs: 'https://postmarkapp.com/developer', site: 'https://postmarkapp.com/' },
  resend: { docs: 'https://resend.com/docs', site: 'https://resend.com/' },
  mailgun: { docs: 'https://documentation.mailgun.com/', site: 'https://www.mailgun.com/' },
  onesignal: { docs: 'https://documentation.onesignal.com/', site: 'https://onesignal.com/' },
  'firebase-cloud-messaging': { docs: 'https://firebase.google.com/docs/cloud-messaging', site: 'https://firebase.google.com/products/cloud-messaging' },
  knock: { docs: 'https://docs.knock.app/', site: 'https://knock.app/' },
  novu: { docs: 'https://docs.novu.co/', site: 'https://novu.co/' },
  'customer-io': { docs: 'https://customer.io/docs/', site: 'https://customer.io/' },

  // --- Authentication and identity ---
  auth0: { docs: 'https://auth0.com/docs', site: 'https://auth0.com/' },
  okta: { docs: 'https://developer.okta.com/docs/', site: 'https://www.okta.com/' },
  clerk: { docs: 'https://clerk.com/docs', site: 'https://clerk.com/' },
  workos: { docs: 'https://workos.com/docs', site: 'https://workos.com/' },
  stytch: { docs: 'https://stytch.com/docs', site: 'https://stytch.com/' },
  descope: { docs: 'https://docs.descope.com/', site: 'https://www.descope.com/' },
  'better-auth': { docs: 'https://www.better-auth.com/docs', site: 'https://www.better-auth.com/' },
  keycloak: { docs: 'https://www.keycloak.org/documentation', site: 'https://www.keycloak.org/' },
  'amazon-cognito': { docs: 'https://docs.aws.amazon.com/cognito/', site: 'https://aws.amazon.com/cognito/' },

  // --- Payments and billing ---
  stripe: { docs: 'https://stripe.com/docs', site: 'https://stripe.com/' },
  adyen: { docs: 'https://docs.adyen.com/', site: 'https://www.adyen.com/' },
  'paypal-and-braintree': { docs: 'https://developer.paypal.com/docs/', site: 'https://developer.paypal.com/' },
  paddle: { docs: 'https://developer.paddle.com/', site: 'https://www.paddle.com/' },
  'lemon-squeezy': { docs: 'https://docs.lemonsqueezy.com/', site: 'https://www.lemonsqueezy.com/' },
  xendit: { docs: 'https://developers.xendit.co/', site: 'https://www.xendit.co/' },
  paymongo: { docs: 'https://developers.paymongo.com/', site: 'https://www.paymongo.com/' },
  chargebee: { docs: 'https://www.chargebee.com/docs/', site: 'https://www.chargebee.com/' },
  lago: { docs: 'https://docs.getlago.com/', site: 'https://getlago.com/' },

  // --- Fintech and identity verification ---
  plaid: { docs: 'https://plaid.com/docs/', site: 'https://plaid.com/' },
  persona: { docs: 'https://docs.withpersona.com/', site: 'https://withpersona.com/' },
  marqeta: { docs: 'https://www.marqeta.com/docs', site: 'https://www.marqeta.com/' },
  'wise-platform': { docs: 'https://docs.wise.com/', site: 'https://wise.com/' },

  // --- Search ---
  algolia: { docs: 'https://www.algolia.com/doc/', site: 'https://www.algolia.com/' },
  elasticsearch: { docs: 'https://www.elastic.co/guide/en/elasticsearch/reference/', site: 'https://www.elastic.co/elasticsearch' },
  opensearch: { docs: 'https://opensearch.org/docs/', site: 'https://opensearch.org/' },
  typesense: { docs: 'https://typesense.org/docs/', site: 'https://typesense.org/' },
  meilisearch: { docs: 'https://www.meilisearch.com/docs', site: 'https://www.meilisearch.com/' },

  // --- AI and machine learning platforms ---
  'openai-api': { docs: 'https://platform.openai.com/docs', site: 'https://platform.openai.com/' },
  'anthropic-api': { docs: 'https://docs.anthropic.com/', site: 'https://www.anthropic.com/' },
  'google-vertex-ai': { docs: 'https://cloud.google.com/vertex-ai/docs', site: 'https://cloud.google.com/vertex-ai' },
  'aws-bedrock': { docs: 'https://docs.aws.amazon.com/bedrock/', site: 'https://aws.amazon.com/bedrock/' },
  'hugging-face': { docs: 'https://huggingface.co/docs', site: 'https://huggingface.co/' },
  replicate: { docs: 'https://replicate.com/docs', site: 'https://replicate.com/' },
  'together-ai': { docs: 'https://docs.together.ai/', site: 'https://www.together.ai/' },
  modal: { docs: 'https://modal.com/docs', site: 'https://modal.com/' },
  pinecone: { docs: 'https://docs.pinecone.io/', site: 'https://www.pinecone.io/' },
  langfuse: { docs: 'https://langfuse.com/docs', site: 'https://langfuse.com/' },
  langsmith: { docs: 'https://docs.smith.langchain.com/', site: 'https://www.langchain.com/langsmith' },
  helicone: { docs: 'https://docs.helicone.ai/', site: 'https://www.helicone.ai/' },

  // --- CI/CD, containers and infrastructure as code ---
  github: { docs: 'https://docs.github.com/', site: 'https://github.com/' },
  gitlab: { docs: 'https://docs.gitlab.com/', site: 'https://about.gitlab.com/' },
  circleci: { docs: 'https://circleci.com/docs/', site: 'https://circleci.com/' },
  jenkins: { docs: 'https://www.jenkins.io/doc/', site: 'https://www.jenkins.io/' },
  terraform: { docs: 'https://developer.hashicorp.com/terraform/docs', site: 'https://www.terraform.io/' },
  opentofu: { docs: 'https://opentofu.org/docs/', site: 'https://opentofu.org/' },
  pulumi: { docs: 'https://www.pulumi.com/docs/', site: 'https://www.pulumi.com/' },
  docker: { docs: 'https://docs.docker.com/', site: 'https://www.docker.com/' },
  kubernetes: { docs: 'https://kubernetes.io/docs/', site: 'https://kubernetes.io/' },
  'argo-cd': { docs: 'https://argo-cd.readthedocs.io/', site: 'https://argoproj.github.io/cd/' },

  // --- Security and secrets ---
  snyk: { docs: 'https://docs.snyk.io/', site: 'https://snyk.io/' },
  doppler: { docs: 'https://docs.doppler.com/', site: 'https://www.doppler.com/' },
  'hashicorp-vault': { docs: 'https://developer.hashicorp.com/vault/docs', site: 'https://www.vaultproject.io/' },
  infisical: { docs: 'https://infisical.com/docs/', site: 'https://infisical.com/' },
  crowdstrike: { docs: 'https://falcon.crowdstrike.com/support/documentation', site: 'https://www.crowdstrike.com/' },

  // --- Feature flags and experimentation ---
  launchdarkly: { docs: 'https://docs.launchdarkly.com/', site: 'https://launchdarkly.com/' },
  statsig: { docs: 'https://docs.statsig.com/', site: 'https://www.statsig.com/' },
  growthbook: { docs: 'https://docs.growthbook.io/', site: 'https://www.growthbook.io/' },
  unleash: { docs: 'https://docs.getunleash.io/', site: 'https://www.getunleash.io/' },

  // --- Backend-as-a-service and content ---
  firebase: { docs: 'https://firebase.google.com/docs', site: 'https://firebase.google.com/' },
  appwrite: { docs: 'https://appwrite.io/docs', site: 'https://appwrite.io/' },
  contentful: { docs: 'https://www.contentful.com/developers/docs/', site: 'https://www.contentful.com/' },
  sanity: { docs: 'https://www.sanity.io/docs', site: 'https://www.sanity.io/' },
  strapi: { docs: 'https://docs.strapi.io/', site: 'https://strapi.io/' },
  'payload-cms': { docs: 'https://payloadcms.com/docs', site: 'https://payloadcms.com/' },

  // --- Storage and media ---
  'amazon-s3': { docs: 'https://docs.aws.amazon.com/s3/', site: 'https://aws.amazon.com/s3/' },
  'cloudflare-r2': { docs: 'https://developers.cloudflare.com/r2/', site: 'https://www.cloudflare.com/developer-platform/products/r2/' },
  'backblaze-b2': { docs: 'https://www.backblaze.com/docs/cloud-storage', site: 'https://www.backblaze.com/cloud-storage' },
  cloudinary: { docs: 'https://cloudinary.com/documentation', site: 'https://cloudinary.com/' },
  mux: { docs: 'https://www.mux.com/docs', site: 'https://www.mux.com/' },
  uploadthing: { docs: 'https://docs.uploadthing.com/', site: 'https://uploadthing.com/' },

  // --- Maps and location ---
  'google-maps-platform': { docs: 'https://developers.google.com/maps/documentation', site: 'https://mapsplatform.google.com/' },
  mapbox: { docs: 'https://docs.mapbox.com/', site: 'https://www.mapbox.com/' },
  here: { docs: 'https://www.here.com/docs', site: 'https://www.here.com/' },
  maplibre: { docs: 'https://maplibre.org/maplibre-gl-js/docs/', site: 'https://maplibre.org/' },

  // --- Integrations and automation ---
  zapier: { docs: 'https://help.zapier.com/', site: 'https://zapier.com/' },
  make: { docs: 'https://www.make.com/en/help', site: 'https://www.make.com/' },
  n8n: { docs: 'https://docs.n8n.io/', site: 'https://n8n.io/' },
  merge: { docs: 'https://docs.merge.dev/', site: 'https://www.merge.dev/' },
  nango: { docs: 'https://docs.nango.dev/', site: 'https://www.nango.dev/' },

  // --- API management and documentation ---
  kong: { docs: 'https://developer.konghq.com/', site: 'https://konghq.com/' },
  apigee: { docs: 'https://cloud.google.com/apigee/docs', site: 'https://cloud.google.com/apigee' },
  'aws-api-gateway': { docs: 'https://docs.aws.amazon.com/apigateway/', site: 'https://aws.amazon.com/api-gateway/' },
  postman: { docs: 'https://learning.postman.com/docs/', site: 'https://www.postman.com/' },
  'apollo-graphos': { docs: 'https://www.apollographql.com/docs/graphos', site: 'https://www.apollographql.com/' },
  hasura: { docs: 'https://hasura.io/docs/', site: 'https://hasura.io/' },
  mintlify: { docs: 'https://mintlify.com/docs', site: 'https://mintlify.com/' },

  // --- Customer and business platforms ---
  salesforce: { docs: 'https://developer.salesforce.com/docs', site: 'https://www.salesforce.com/' },
  hubspot: { docs: 'https://developers.hubspot.com/', site: 'https://www.hubspot.com/' },
  zendesk: { docs: 'https://developer.zendesk.com/', site: 'https://www.zendesk.com/' },
  intercom: { docs: 'https://developers.intercom.com/', site: 'https://www.intercom.com/' },
};

/** Docs and site links for a product, if they have been curated. */
export function getProductLinks(productId: string): ProductLinks | undefined {
  return PRODUCT_LINKS[productId];
}
