import React from 'react';
import { registerBlock, BlockGroup, BlockType, HeadingPayloadSchema, ParagraphPayloadSchema, NumberedListPayloadSchema, BulletedListPayloadSchema, CodePayloadSchema, DetailPayloadSchema, ImagePayloadSchema, VideoPayloadSchema, QuizPayloadSchema, CalloutPayloadSchema, DividerPayloadSchema } from '@lms/block-registry';
import type { HeadingPayload, ParagraphPayload, NumberedListPayload, BulletedListPayload, CodePayload, DetailPayload, ImagePayload, VideoPayload, QuizPayload, CalloutPayload } from '@lms/block-registry';
import { z } from 'zod';

// ─── Stub renderer for blocks not yet implemented ─────────────────────────────

function makeStub(label: string) {
  return function StubRenderer() {
    return (
      <p style={{ color: 'var(--color-text-secondary, #888)', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>
        [{label} — editor coming soon]
      </p>
    );
  };
}

// ─── Text blocks ──────────────────────────────────────────────────────────────

export function registerDefaultBlocks(): void {
  registerBlock({
    type: BlockType.HEADING,
    group: BlockGroup.TEXT,
    label: 'Heading',
    icon: 'H',
    payloadSchema: HeadingPayloadSchema,
    defaultPayload: { text: 'New Heading', level: 2, alignment: 'left', weight: 'bold', italic: false, underline: false } as HeadingPayload,
    Renderer: ({ payload }) => {
      const Tag = `h${payload.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      const style: React.CSSProperties = {
        textAlign: (payload.alignment ?? 'left') as React.CSSProperties['textAlign'],
        fontWeight: payload.weight === 'bold' ? 700 : payload.weight === 'light' ? 300 : 400,
        fontStyle: payload.italic ? 'italic' : 'normal',
        textDecoration: payload.underline ? 'underline' : undefined,
        fontSize: payload.size ? ({ xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' }[payload.size]) : undefined,
        margin: 0,
      };
      const content = payload.link
        ? <a href={payload.link.url} target={payload.link.newTab ? '_blank' : undefined} rel="noreferrer">{payload.text}</a>
        : payload.text;
      return <Tag style={style}>{content}</Tag>;
    },
  });

  registerBlock({
    type: BlockType.PARAGRAPH,
    group: BlockGroup.TEXT,
    label: 'Paragraph',
    icon: '¶',
    payloadSchema: ParagraphPayloadSchema,
    defaultPayload: { html: '<p>New paragraph</p>', alignment: 'left', weight: 'normal', italic: false, underline: false, size: 'base' } as ParagraphPayload,
    Renderer: ({ payload }) => {
      const sizeMap: Record<string, string> = { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' };
      const style: React.CSSProperties = {
        textAlign: (payload.alignment ?? 'left') as React.CSSProperties['textAlign'],
        fontWeight: payload.weight === 'bold' ? 700 : payload.weight === 'light' ? 300 : 400,
        fontStyle: payload.italic ? 'italic' : 'normal',
        textDecoration: payload.underline ? 'underline' : undefined,
        fontSize: payload.size ? sizeMap[payload.size] : undefined,
      };
      return <div style={style} dangerouslySetInnerHTML={{ __html: payload.html }} />;
    },
  });

  registerBlock({
    type: BlockType.NUMBERED_LIST,
    group: BlockGroup.TEXT,
    label: 'Numbered list',
    icon: '1.',
    payloadSchema: NumberedListPayloadSchema,
    defaultPayload: { items: ['First item', 'Second item'] } as NumberedListPayload,
    Renderer: ({ payload }) => (
      <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
        {payload.items.map((item, i) => <li key={i}>{item}</li>)}
      </ol>
    ),
  });

  registerBlock({
    type: BlockType.BULLETED_LIST,
    group: BlockGroup.TEXT,
    label: 'Bulleted list',
    icon: '•',
    payloadSchema: BulletedListPayloadSchema,
    defaultPayload: { items: ['First item', 'Second item'] } as BulletedListPayload,
    Renderer: ({ payload }) => (
      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
        {payload.items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ),
  });

  registerBlock({
    type: BlockType.CODE,
    group: BlockGroup.TEXT,
    label: 'Code',
    icon: '</>',
    payloadSchema: CodePayloadSchema,
    defaultPayload: { code: '// your code here', language: 'javascript', numberLines: true, allowCopy: true } as CodePayload,
    Renderer: ({ payload }) => (
      <pre style={{ margin: 0, padding: '1rem', background: 'var(--color-surface-muted, #f5f5f5)', borderRadius: '4px', overflow: 'auto', fontSize: '0.875em' }}>
        {payload.filename && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #888)', marginBottom: '0.5rem' }}>
            {payload.filename}
          </div>
        )}
        <code>{payload.code}</code>
      </pre>
    ),
  });

  registerBlock({
    type: BlockType.DETAIL,
    group: BlockGroup.TEXT,
    label: 'Detail',
    icon: '▸',
    payloadSchema: DetailPayloadSchema,
    defaultPayload: { summary: 'Click to expand', body: 'Detail content here' } as DetailPayload,
    Renderer: ({ payload }) => (
      <details style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: '4px', padding: '0.5rem 1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{payload.summary}</summary>
        <div style={{ paddingTop: '0.5rem' }} dangerouslySetInnerHTML={{ __html: payload.body }} />
      </details>
    ),
  });

  // ─── Media blocks ─────────────────────────────────────────────────────────

  registerBlock({
    type: BlockType.IMAGE,
    group: BlockGroup.MEDIA,
    label: 'Image',
    icon: '🖼',
    payloadSchema: ImagePayloadSchema,
    defaultPayload: { src: 'https://placehold.co/600x400', alt: 'Image', caption: '' } as ImagePayload,
    Renderer: ({ payload }) => (
      <figure style={{ margin: 0 }}>
        <img src={payload.src} alt={payload.alt} style={{ maxWidth: '100%' }} />
        {payload.caption && <figcaption style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>{payload.caption}</figcaption>}
      </figure>
    ),
  });

  registerBlock({
    type: BlockType.GALLERY,
    group: BlockGroup.MEDIA,
    label: 'Gallery',
    icon: '⊞',
    payloadSchema: z.object({}),
    defaultPayload: {},
    Renderer: makeStub('Gallery'),
  });

  registerBlock({
    type: BlockType.AUDIO,
    group: BlockGroup.MEDIA,
    label: 'Audio',
    icon: '♪',
    payloadSchema: z.object({ src: z.string(), title: z.string() }),
    defaultPayload: { src: '', title: 'Audio' },
    Renderer: makeStub('Audio'),
  });

  registerBlock({
    type: BlockType.VIDEO,
    group: BlockGroup.MEDIA,
    label: 'Video',
    icon: '▶',
    payloadSchema: VideoPayloadSchema,
    defaultPayload: { src: 'https://example.com/video.mp4', title: 'Video' } as VideoPayload,
    Renderer: ({ payload }) => (
      <figure style={{ margin: 0 }}>
        <video src={payload.src} controls poster={payload.posterSrc} title={payload.title} style={{ maxWidth: '100%' }} />
        <figcaption style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>{payload.title}</figcaption>
      </figure>
    ),
  });

  registerBlock({
    type: BlockType.IMAGE_TEXT,
    group: BlockGroup.MEDIA,
    label: 'Image and text',
    icon: '▤',
    payloadSchema: z.object({}),
    defaultPayload: {},
    Renderer: makeStub('Image and text'),
  });

  registerBlock({
    type: BlockType.FILE,
    group: BlockGroup.MEDIA,
    label: 'File',
    icon: '📎',
    payloadSchema: z.object({ src: z.string(), filename: z.string() }),
    defaultPayload: { src: '', filename: 'file.pdf' },
    Renderer: makeStub('File'),
  });

  // ─── Design blocks ────────────────────────────────────────────────────────

  registerBlock({
    type: BlockType.ACCORDION,
    group: BlockGroup.DESIGN,
    label: 'Accordion',
    icon: '≡',
    payloadSchema: z.object({
      items: z.array(z.object({
        title: z.string(),
        body: z.string(),
        defaultOpen: z.boolean().optional().default(false),
      })).min(1),
    }),
    defaultPayload: {
      items: [
        { title: 'Panel 1', body: 'Content for panel 1.', defaultOpen: true },
        { title: 'Panel 2', body: 'Content for panel 2.', defaultOpen: false },
      ],
    },
    Renderer: ({ payload }) => {
      const p = payload as { items: { title: string; body: string; defaultOpen?: boolean }[] };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {p.items.map((item, i) => (
            <details key={i} open={item.defaultOpen} style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: '6px', overflow: 'hidden' }}>
              <summary style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: 600, background: 'var(--color-surface-subtle, #f9f9f9)', userSelect: 'none' }}>
                {item.title}
              </summary>
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
                dangerouslySetInnerHTML={{ __html: item.body }} />
            </details>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.BUTTONS,
    group: BlockGroup.DESIGN,
    label: 'Buttons',
    icon: '⊡',
    payloadSchema: z.object({
      buttons: z.array(z.object({
        label: z.string(),
        url: z.string(),
        variant: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
        newTab: z.boolean().optional().default(false),
      })).min(1),
      alignment: z.enum(['left', 'center', 'right']).optional().default('left'),
    }),
    defaultPayload: {
      buttons: [{ label: 'Get started', url: '#', variant: 'primary' as const, newTab: false }],
      alignment: 'left' as const,
    },
    Renderer: ({ payload }) => {
      const p = payload as { buttons: { label: string; url: string; variant: 'primary' | 'secondary' | 'ghost'; newTab?: boolean }[]; alignment?: string };
      const variantStyles: Record<string, React.CSSProperties> = {
        primary: { background: 'var(--color-primary, #2563eb)', color: '#fff', border: 'none' },
        secondary: { background: 'transparent', color: 'var(--color-primary, #2563eb)', border: '1.5px solid var(--color-primary, #2563eb)' },
        ghost: { background: 'transparent', color: 'var(--color-text-primary, #111)', border: '1.5px solid var(--color-border, #e0e0e0)' },
      };
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: (p.alignment ?? 'left') as React.CSSProperties['justifyContent'] }}>
          {p.buttons.map((btn, i) => (
            <a key={i} href={btn.url} target={btn.newTab ? '_blank' : undefined} rel="noreferrer"
              style={{ ...variantStyles[btn.variant ?? 'primary'], padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block', cursor: 'pointer' }}>
              {btn.label}
            </a>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.COLUMNS,
    group: BlockGroup.DESIGN,
    label: 'Columns',
    icon: '⫾',
    payloadSchema: z.object({
      columns: z.number().int().min(2).max(6).default(2),
      gap: z.enum(['sm', 'md', 'lg']).optional().default('md'),
    }),
    defaultPayload: { columns: 2, gap: 'md' as const },
    Renderer: ({ payload }) => {
      const p = payload as { columns: number; gap?: string };
      const gapMap: Record<string, string> = { sm: '0.5rem', md: '1rem', lg: '2rem' };
      const gap = gapMap[p.gap ?? 'md'];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap, minHeight: '60px' }}>
          {Array.from({ length: p.columns }).map((_, i) => (
            <div key={i} style={{ border: '1px dashed var(--color-border, #d1d5db)', borderRadius: '4px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.78rem', padding: '0.5rem' }}>
              Column {i + 1}
            </div>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.GROUP,
    group: BlockGroup.DESIGN,
    label: 'Group',
    icon: '⬚',
    payloadSchema: z.object({
      padding: z.enum(['none', 'sm', 'md', 'lg']).optional().default('md'),
      background: z.string().optional(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg']).optional().default('md'),
      border: z.boolean().optional().default(false),
    }),
    defaultPayload: { padding: 'md' as const, borderRadius: 'md' as const, border: true },
    Renderer: ({ payload }) => {
      const p = payload as { padding?: string; background?: string; borderRadius?: string; border?: boolean };
      const padMap: Record<string, string> = { none: '0', sm: '0.5rem', md: '1rem', lg: '2rem' };
      const radMap: Record<string, string> = { none: '0', sm: '4px', md: '8px', lg: '16px' };
      return (
        <div style={{
          padding: padMap[p.padding ?? 'md'],
          background: p.background ?? 'var(--color-surface-subtle, #f9f9f9)',
          borderRadius: radMap[p.borderRadius ?? 'md'],
          border: p.border ? '1px dashed var(--color-border, #d1d5db)' : undefined,
          minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.78rem',
        }}>
          Group — add blocks inside
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.ROW,
    group: BlockGroup.DESIGN,
    label: 'Row',
    icon: '━',
    payloadSchema: z.object({
      gap: z.enum(['sm', 'md', 'lg']).optional().default('md'),
      align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('center'),
      wrap: z.boolean().optional().default(true),
    }),
    defaultPayload: { gap: 'md' as const, align: 'center' as const, wrap: true },
    Renderer: ({ payload }) => {
      const p = payload as { gap?: string; align?: string; wrap?: boolean };
      const gapMap: Record<string, string> = { sm: '0.5rem', md: '1rem', lg: '2rem' };
      return (
        <div style={{
          display: 'flex', flexDirection: 'row',
          gap: gapMap[p.gap ?? 'md'],
          alignItems: p.align ?? 'center',
          flexWrap: p.wrap ? 'wrap' : 'nowrap',
          minHeight: '48px', padding: '0.5rem',
          border: '1px dashed var(--color-border, #d1d5db)', borderRadius: '4px',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, minWidth: '60px', minHeight: '32px', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e0e0e0)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary, #9ca3af)' }}>
              Item {i}
            </div>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.STACK,
    group: BlockGroup.DESIGN,
    label: 'Stack',
    icon: '⬓',
    payloadSchema: z.object({
      gap: z.enum(['sm', 'md', 'lg']).optional().default('md'),
      align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('stretch'),
    }),
    defaultPayload: { gap: 'md' as const, align: 'stretch' as const },
    Renderer: ({ payload }) => {
      const p = payload as { gap?: string; align?: string };
      const gapMap: Record<string, string> = { sm: '0.5rem', md: '1rem', lg: '2rem' };
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: gapMap[p.gap ?? 'md'],
          alignItems: p.align ?? 'stretch',
          padding: '0.5rem',
          border: '1px dashed var(--color-border, #d1d5db)', borderRadius: '4px',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: '100%', minHeight: '28px', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e0e0e0)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary, #9ca3af)' }}>
              Item {i}
            </div>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.GRID,
    group: BlockGroup.DESIGN,
    label: 'Grid',
    icon: '⊞',
    payloadSchema: z.object({
      columns: z.number().int().min(2).max(6).default(3),
      gap: z.enum(['sm', 'md', 'lg']).optional().default('md'),
      rows: z.number().int().min(1).max(6).default(2),
    }),
    defaultPayload: { columns: 3, gap: 'md' as const, rows: 2 },
    Renderer: ({ payload }) => {
      const p = payload as { columns: number; gap?: string; rows: number };
      const gapMap: Record<string, string> = { sm: '0.5rem', md: '1rem', lg: '2rem' };
      const cells = p.columns * p.rows;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: gapMap[p.gap ?? 'md'] }}>
          {Array.from({ length: cells }).map((_, i) => (
            <div key={i} style={{ border: '1px dashed var(--color-border, #d1d5db)', borderRadius: '4px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.75rem' }}>
              {i + 1}
            </div>
          ))}
        </div>
      );
    },
  });

  registerBlock({
    type: BlockType.SEPARATOR,
    group: BlockGroup.DESIGN,
    label: 'Separator',
    icon: '─',
    payloadSchema: z.object({
      style: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
      thickness: z.number().optional().default(1),
      color: z.string().optional(),
    }),
    defaultPayload: { style: 'solid' as const, thickness: 1 },
    Renderer: ({ payload }) => {
      const p = payload as { style?: string; thickness?: number; color?: string };
      return (
        <hr style={{
          border: 'none',
          borderTop: `${p.thickness ?? 1}px ${p.style ?? 'solid'} ${p.color ?? 'var(--color-border, #e0e0e0)'}`,
          margin: '0.25rem 0',
        }} />
      );
    },
  });

  registerBlock({
    type: BlockType.SPACER,
    group: BlockGroup.DESIGN,
    label: 'Spacer',
    icon: '↕',
    payloadSchema: z.object({ height: z.number().optional().default(48) }),
    defaultPayload: { height: 48 },
    Renderer: ({ payload }) => {
      const p = payload as { height: number };
      return (
        <div style={{ height: `${p.height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed var(--color-border, #d1d5db)' }} />
          <span style={{ background: 'var(--color-surface-subtle, #f9f9f9)', padding: '0 0.5rem', fontSize: '0.72rem', color: 'var(--color-text-secondary, #9ca3af)', position: 'relative', zIndex: 1 }}>
            {p.height}px
          </span>
        </div>
      );
    },
  });

  // ─── Learning blocks ──────────────────────────────────────────────────────

  registerBlock({
    type: BlockType.QUIZ,
    group: BlockGroup.LEARNING,
    label: 'Quiz',
    icon: '?',
    payloadSchema: QuizPayloadSchema,
    defaultPayload: {
      question: 'New question',
      options: [
        { id: 'a', label: 'Option A' },
        { id: 'b', label: 'Option B' },
      ],
      correctOptionId: 'a',
    } as QuizPayload,
    Renderer: ({ payload }) => (
      <div>
        <p><strong>{payload.question}</strong></p>
        <ul>
          {payload.options.map((opt) => (
            <li key={opt.id}>{opt.label}</li>
          ))}
        </ul>
      </div>
    ),
  });

  registerBlock({
    type: BlockType.CALLOUT,
    group: BlockGroup.TEXT,
    label: 'Callout',
    icon: '!',
    payloadSchema: CalloutPayloadSchema,
    defaultPayload: { type: 'info', title: 'Note', body: 'Callout content' } as CalloutPayload,
    Renderer: ({ payload }) => (
      <aside style={{ borderLeft: '4px solid var(--color-primary, #0066cc)', padding: '0.75rem 1rem', background: 'var(--color-surface-muted, #f5f5f5)', borderRadius: '0 4px 4px 0' }}>
        {payload.title && <strong>{payload.title} </strong>}
        <span>{payload.body}</span>
      </aside>
    ),
  });

  registerBlock({
    type: BlockType.DIVIDER,
    group: BlockGroup.DESIGN,
    label: 'Divider',
    icon: '─',
    payloadSchema: DividerPayloadSchema,
    defaultPayload: {},
    Renderer: () => <hr style={{ border: 'none', borderTop: '1px solid var(--color-border, #e0e0e0)', margin: '0.5rem 0' }} />,
  });
}
