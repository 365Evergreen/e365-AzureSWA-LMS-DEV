/**
 * Seed script: uploads dummy site-content bundles to Azurite (local dev storage)
 * and writes metadata entries to the sitecontent table.
 *
 * Run with:
 *   npx tsx scripts/seedContent.ts
 *
 * Requires Azurite to be running (started by `npm run dev` in the backend).
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { TableClient } from '@azure/data-tables';
import { randomUUID } from 'crypto';

const CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING ?? 'UseDevelopmentStorage=true';

const CONTAINER = 'site-content';
const TABLE = 'sitecontent';

// ─── Seed data ────────────────────────────────────────────────────────────────

const homepageBundle = {
  blocks: [
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Build better learning experiences',
        level: 1,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p>The LMS Platform gives your team the tools to create, deliver, and iterate on world-class learning content — faster than ever. Whether you are authoring a new course, publishing a knowledge article, or tracking learner progress, everything is in one place.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'callout',
      version: 1,
      payload: {
        type: 'tip',
        title: 'Get started in minutes',
        body: 'Sign in with your organisation account and explore the course catalogue, or head to the Knowledge Base for guided tutorials.',
      },
    },
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Why LMS Platform?',
        level: 2,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p><strong>Block-based authoring:</strong> Compose learning experiences from modular, reusable blocks. Drag, drop, and publish with ease.</p><p><strong>Static-first delivery:</strong> Pre-rendered content means blazing-fast load times and a seamless learner experience every time.</p><p><strong>Evergreen platform:</strong> Automated review cycles and version tracking keep your content accurate and up to date.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'callout',
      version: 1,
      payload: {
        type: 'info',
        title: 'Explore the catalogue',
        body: 'Browse our growing library of courses covering Azure, leadership, design, and more.',
      },
    },
    {
      id: randomUUID(),
      type: 'divider',
      version: 1,
      payload: {},
    },
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Latest from the Knowledge Base',
        level: 2,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<ul><li><a href="/kb/creating-your-first-course">Creating Your First Course</a></li><li><a href="/kb/navigating-learning-dashboard">Navigating Your Learning Dashboard</a></li><li><a href="/kb/getting-help-learner">Getting Help as a Learner</a></li></ul>',
      },
    },
  ],
};

const whatWeDoBundle = {
  blocks: [
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'What We Do',
        level: 1,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p>We build and operate a modern learning management platform that helps organisations upskill their teams at scale. From authoring tools to learner analytics, we cover the full content lifecycle.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Content Authoring',
        level: 2,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p>Our block-based editor lets subject matter experts build rich, interactive content without writing a line of code. Templates ensure consistency across all sites while giving authors the flexibility to tell their story.</p><p>Supported block types include rich text, images, video embeds, code samples, callouts, and interactive quizzes.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'callout',
      version: 1,
      payload: {
        type: 'info',
        title: 'Supported content types',
        body: 'Landing pages, content pages (with optional sidebars), blog posts, knowledge base articles, and structured learning courses — all managed from a single editor.',
      },
    },
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Learning Delivery',
        level: 2,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p>Content is pre-rendered and served as static bundles from Azure Blob Storage, delivering sub-second load times regardless of learner location. A CDN sits in front of all public assets, caching content at the edge.</p><p>The learner site tracks progress block-by-block, allowing learners to resume exactly where they left off and administrators to report on completion rates in real time.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'heading',
      version: 1,
      payload: {
        text: 'Knowledge Management',
        level: 2,
      },
    },
    {
      id: randomUUID(),
      type: 'paragraph',
      version: 1,
      payload: {
        html: '<p>The Knowledge Base is a curated library of articles tagged by audience, product version, and topic. Articles are authored in the same block-based editor and published to a dedicated knowledge site optimised for search and discoverability.</p>',
      },
    },
    {
      id: randomUUID(),
      type: 'divider',
      version: 1,
      payload: {},
    },
    {
      id: randomUUID(),
      type: 'callout',
      version: 1,
      payload: {
        type: 'tip',
        title: 'Want to know more?',
        body: 'Explore our course catalogue or read the blog for the latest platform news and authoring guides.',
      },
    },
  ],
};

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadBundle(
  container: ReturnType<BlobServiceClient['getContainerClient']>,
  pageId: string,
  bundle: object
): Promise<string> {
  const blob = container.getBlockBlobClient(`${pageId}.json`);
  const json = JSON.stringify(bundle, null, 2);
  await blob.upload(json, Buffer.byteLength(json), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  console.log(`  ✔  Uploaded blob: ${blob.url}`);
  return blob.url;
}

async function upsertPageMeta(
  table: TableClient,
  meta: {
    pageId: string;
    slug: string;
    title: string;
    description: string;
    contentType: 'page' | 'post';
    templateId: string;
    bundleUrl: string;
    publishedAt: string;
  }
) {
  await table.upsertEntity(
    {
      partitionKey: meta.contentType,
      rowKey: meta.slug,
      pageId: meta.pageId,
      title: meta.title,
      description: meta.description,
      status: 'published',
      templateId: meta.templateId,
      bundleUrl: meta.bundleUrl,
      publishedAt: meta.publishedAt,
      updatedAt: meta.publishedAt,
      author: 'seed',
      tags: '',
    },
    'Replace'
  );
  console.log(`  ✔  Table row: ${meta.contentType}/${meta.slug}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding site-content to:', CONNECTION_STRING === 'UseDevelopmentStorage=true' ? 'Azurite (local)' : 'Azure Storage');

  const blobClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
  const container = blobClient.getContainerClient(CONTAINER);
  await container.createIfNotExists({ access: 'blob' });
  console.log(`Container '${CONTAINER}' ready`);

  const table = TableClient.fromConnectionString(CONNECTION_STRING, TABLE);
  await table.createTable().catch(() => {});
  console.log(`Table '${TABLE}' ready`);

  // ── Homepage ────────────────────────────────────────────────────────────────
  console.log('\n→ Seeding homepage...');
  const homeId = 'page-home-v1';
  const homeUrl = await uploadBundle(container, homeId, homepageBundle);
  await upsertPageMeta(table, {
    pageId: homeId,
    slug: 'home',
    title: 'Home',
    description: 'The LMS Platform public homepage.',
    contentType: 'page',
    templateId: 'landing-page',
    bundleUrl: homeUrl,
    publishedAt: '2025-01-15T10:00:00.000Z',
  });

  // ── What We Do ──────────────────────────────────────────────────────────────
  console.log('\n→ Seeding What We Do page...');
  const whatWeDoId = 'page-what-we-do-v1';
  const whatWeDoUrl = await uploadBundle(container, whatWeDoId, whatWeDoBundle);
  await upsertPageMeta(table, {
    pageId: whatWeDoId,
    slug: 'what-we-do',
    title: 'What We Do',
    description: 'An overview of the LMS Platform — authoring, delivery, and knowledge management.',
    contentType: 'page',
    templateId: 'content-page-fse',
    bundleUrl: whatWeDoUrl,
    publishedAt: '2025-01-20T10:00:00.000Z',
  });

  console.log('\n✅  Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
