import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { listNavItems } from '../lib/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export interface NavNode {
  slug: string;
  label: string;
  href: string;
  order: number;
  children: NavNode[];
}

async function getNavHandler(
  req: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: CORS_HEADERS };
  }

  const items = await listNavItems();

  const topLevel: NavNode[] = [];
  const childMap = new Map<string, NavNode[]>();

  for (const item of items) {
    const node: NavNode = {
      slug: item.slug,
      label: item.navLabel || item.title,
      href: `/${item.slug}`,
      order: item.navOrder ?? 0,
      children: [],
    };
    if (!item.navParent) {
      topLevel.push(node);
    } else {
      if (!childMap.has(item.navParent)) childMap.set(item.navParent, []);
      childMap.get(item.navParent)!.push(node);
    }
  }

  for (const node of topLevel) {
    node.children = (childMap.get(node.slug) ?? []).sort((a, b) => a.order - b.order);
  }
  topLevel.sort((a, b) => a.order - b.order);

  return {
    status: 200,
    jsonBody: topLevel,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' },
  };
}

app.http('getNav', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'nav',
  handler: getNavHandler,
});
