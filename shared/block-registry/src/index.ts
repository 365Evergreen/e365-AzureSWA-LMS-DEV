import type { ComponentType } from 'react';
import { z } from 'zod';

// ─── Block Types ──────────────────────────────────────────────────────────────

export const BlockType = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  IMAGE: 'image',
  VIDEO: 'video',
  QUIZ: 'quiz',
  CODE: 'code',
  CALLOUT: 'callout',
  DIVIDER: 'divider',
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

// ─── Block Payload Schemas ────────────────────────────────────────────────────

export const HeadingPayloadSchema = z.object({
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const ParagraphPayloadSchema = z.object({
  html: z.string(),
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

export const QuizPayloadSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ id: z.string(), label: z.string() })),
  correctOptionId: z.string(),
  explanation: z.string().optional(),
});

export const CodePayloadSchema = z.object({
  code: z.string(),
  language: z.string(),
  filename: z.string().optional(),
});

export const CalloutPayloadSchema = z.object({
  type: z.enum(['info', 'warning', 'danger', 'tip']),
  title: z.string().optional(),
  body: z.string(),
});

export const DividerPayloadSchema = z.object({});

// ─── Block Definition ─────────────────────────────────────────────────────────

export interface BlockRendererProps<TPayload> {
  payload: TPayload;
  blockId: string;
}

export interface BlockDefinition<TPayload = unknown> {
  type: BlockType;
  label: string;
  icon: string;
  payloadSchema: z.ZodType<TPayload>;
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

export function isRegisteredBlockType(value: string): value is BlockType {
  return Object.values(BlockType).includes(value as BlockType);
}
