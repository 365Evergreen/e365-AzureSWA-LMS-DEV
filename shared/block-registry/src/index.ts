import type { ComponentType } from 'react';
import { z } from 'zod';

// ─── Block Groups ─────────────────────────────────────────────────────────────

export const BlockGroup = {
  TEXT: 'Text',
  MEDIA: 'Media',
  DESIGN: 'Design',
  LEARNING: 'Learning',
} as const;

export type BlockGroup = (typeof BlockGroup)[keyof typeof BlockGroup];

// ─── Block Types ──────────────────────────────────────────────────────────────

export const BlockType = {
  // Text
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  NUMBERED_LIST: 'numbered-list',
  BULLETED_LIST: 'bulleted-list',
  CODE: 'code',
  DETAIL: 'detail',
  // Media
  IMAGE: 'image',
  GALLERY: 'gallery',
  AUDIO: 'audio',
  VIDEO: 'video',
  VIDEO_EMBED: 'video-embed',
  IMAGE_TEXT: 'image-text',
  FILE: 'file',
  // Design
  ACCORDION: 'accordion',
  BUTTONS: 'buttons',
  COLUMNS: 'columns',
  GROUP: 'group',
  ROW: 'row',
  STACK: 'stack',
  GRID: 'grid',
  HERO: 'hero',
  SEPARATOR: 'separator',
  SPACER: 'spacer',
  // Learning (LMS-specific)
  QUIZ: 'quiz',
  CALLOUT: 'callout',
  DIVIDER: 'divider',
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

// ─── Shared Sub-schemas ───────────────────────────────────────────────────────

export const LinkSchema = z.object({
  url: z.string().url(),
  newTab: z.boolean().optional().default(false),
});

// ─── Explicit Payload Types (for use in renderers / callers) ─────────────────

export interface HeadingPayload {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | 'light';
  italic?: boolean;
  underline?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  link?: { url: string; newTab?: boolean };
}

export interface ParagraphPayload {
  html: string;
  alignment?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | 'light';
  italic?: boolean;
  underline?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  link?: { url: string; newTab?: boolean };
}

export interface NumberedListPayload { items: string[] }
export interface BulletedListPayload { items: string[] }

export interface CodePayload {
  code: string;
  language: string;
  filename?: string;
  numberLines?: boolean;
  allowCopy?: boolean;
}

export interface DetailPayload { summary: string; body: string }

export interface ImagePayload { src: string; alt: string; caption?: string }

export interface VideoPayload { src: string; title: string; posterSrc?: string }

export interface VideoEmbedPayload { url: string; title?: string; aspectRatio?: '16:9' | '4:3' | '1:1' }

export interface HeroPayload {
  layout: 'left' | 'center' | 'right';
  height: 'small' | 'medium' | 'large' | 'full';
  heading: string;
  subheading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  backgroundColor?: string;
  textColor?: 'light' | 'dark';
}

export interface GridCellBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

export interface GridCell {
  id: string;
  blocks: GridCellBlock[];
}

export interface GridPayload {
  columns: 2 | 3 | 4;
  rows: 1 | 2 | 3;
  cells: GridCell[];
}

export interface QuizPayload {
  question: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation?: string;
}

export interface CalloutPayload {
  type: 'info' | 'warning' | 'danger' | 'tip';
  title?: string;
  body: string;
}

export interface DividerPayload {}

// ─── Block Payload Schemas ────────────────────────────────────────────────────

export const TEXT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TEXT_SIZE_CSS: Record<TextSize, string> = {
  xs: '0.75rem', sm: '0.875rem', base: '1rem',
  lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem',
};

export const HeadingPayloadSchema = z.object({
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  alignment: z.enum(['left', 'center', 'right']).optional().default('left'),
  weight: z.enum(['normal', 'bold', 'light']).optional().default('bold'),
  italic: z.boolean().optional().default(false),
  underline: z.boolean().optional().default(false),
  size: z.enum(TEXT_SIZES).optional(),
  link: LinkSchema.optional(),
});

export const ParagraphPayloadSchema = z.object({
  html: z.string(),
  alignment: z.enum(['left', 'center', 'right']).optional().default('left'),
  weight: z.enum(['normal', 'bold', 'light']).optional().default('normal'),
  italic: z.boolean().optional().default(false),
  underline: z.boolean().optional().default(false),
  size: z.enum(TEXT_SIZES).optional().default('base'),
  link: LinkSchema.optional(),
});

export const NumberedListPayloadSchema = z.object({
  items: z.array(z.string()).min(1),
});

export const BulletedListPayloadSchema = z.object({
  items: z.array(z.string()).min(1),
});

export const CodePayloadSchema = z.object({
  code: z.string(),
  language: z.string(),
  filename: z.string().optional(),
  numberLines: z.boolean().optional().default(true),
  allowCopy: z.boolean().optional().default(true),
});

export const DetailPayloadSchema = z.object({
  summary: z.string(),
  body: z.string(),
});

export const ImagePayloadSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
});

export const VideoPayloadSchema = z.object({
  src: z.string().url(),
  title: z.string(),
  posterSrc: z.string().url().optional(),
});

export const VideoEmbedPayloadSchema = z.object({
  url: z.string().url(),
  title: z.string().optional().default(''),
  aspectRatio: z.enum(['16:9', '4:3', '1:1']).optional().default('16:9'),
});

export const QuizPayloadSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ id: z.string(), label: z.string() })),
  correctOptionId: z.string(),
  explanation: z.string().optional(),
});

export const CalloutPayloadSchema = z.object({
  type: z.enum(['info', 'warning', 'danger', 'tip']),
  title: z.string().optional(),
  body: z.string(),
});

export const DividerPayloadSchema = z.object({});

export const HeroPayloadSchema = z.object({
  layout: z.enum(['left', 'center', 'right']).optional().default('center'),
  height: z.enum(['small', 'medium', 'large', 'full']).optional().default('medium'),
  heading: z.string().optional().default(''),
  subheading: z.string().optional().default(''),
  body: z.string().optional().default(''),
  ctaLabel: z.string().optional().default(''),
  ctaUrl: z.string().optional().default(''),
  backgroundImage: z.string().optional().default(''),
  overlayOpacity: z.number().min(0).max(100).optional().default(0),
  backgroundColor: z.string().optional().default('#1a1a2e'),
  textColor: z.enum(['light', 'dark']).optional().default('light'),
});

const GridCellBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.any(),
});

const GridCellSchema = z.object({
  id: z.string(),
  blocks: z.array(GridCellBlockSchema).default([]),
});

export const GridPayloadSchema = z.object({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3 as 3),
  rows: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1 as 1),
  cells: z.array(GridCellSchema).default([]),
});

// ─── Block Definition ─────────────────────────────────────────────────────────

export interface BlockRendererProps<TPayload> {
  payload: TPayload;
  blockId: string;
}

export interface BlockDefinition<TPayload = unknown> {
  type: BlockType;
  group: BlockGroup;
  label: string;
  icon: string;
  // Structural duck-type: accepts both Zod v3 and v4 schemas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payloadSchema: { parse(data: unknown): any; safeParse(data: unknown): any };
  defaultPayload: TPayload;
  Renderer: ComponentType<BlockRendererProps<TPayload>>;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<BlockType, BlockDefinition>();

export function registerBlock<TPayload>(definition: BlockDefinition<TPayload>): void {
  registry.set(definition.type, definition as BlockDefinition);
}

export function getBlock(type: BlockType): BlockDefinition | undefined {
  return registry.get(type);
}

export function getAllBlocks(): BlockDefinition[] {
  return Array.from(registry.values());
}

export function getAllGroups(): BlockGroup[] {
  const seen = new Set<BlockGroup>();
  const groups: BlockGroup[] = [];
  for (const def of registry.values()) {
    if (!seen.has(def.group)) {
      seen.add(def.group);
      groups.push(def.group);
    }
  }
  return groups;
}

export function getBlocksByGroup(group: BlockGroup): BlockDefinition[] {
  return Array.from(registry.values()).filter((def) => def.group === group);
}

export function isRegisteredBlockType(value: string): value is BlockType {
  return Object.values(BlockType).includes(value as BlockType);
}
