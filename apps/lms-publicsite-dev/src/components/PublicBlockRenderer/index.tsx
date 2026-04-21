import { useState, type CSSProperties } from 'react'
import {
  BlockGroup,
  BlockType,
  getBlock,
  isRegisteredBlockType,
  registerBlock,
  type BlockRendererProps,
} from '@lms/block-registry'
import type {
  AccordionPayload,
  ColumnsPayload,
  CalloutPayload,
  CodePayload,
  DetailPayload,
  DividerPayload,
  FormPayload,
  GridPayload,
  HeadingPayload,
  ImagePayload,
  ParagraphPayload,
  QuizPayload,
  VideoEmbedPayload,
  VideoPayload,
} from '@lms/block-registry'
import {
  AccordionPayloadSchema,
  ColumnsPayloadSchema,
  CalloutPayloadSchema,
  CodePayloadSchema,
  DetailPayloadSchema,
  DividerPayloadSchema,
  FormPayloadSchema,
  GridPayloadSchema,
  HeadingPayloadSchema,
  ImagePayloadSchema,
  BulletedListPayloadSchema,
  NumberedListPayloadSchema,
  ParagraphPayloadSchema,
  QuizPayloadSchema,
  VideoEmbedPayloadSchema,
  VideoPayloadSchema,
  normalizeAccordionPayload,
  normalizeColumnsPayload,
} from '@lms/block-registry'
import { sanitizeHtml } from '@lms/shared-ui'
import type { Block as SharedBlock } from '@lms/shared-schemas'
import { useLocation } from 'react-router-dom'
import { apiBase } from '../../api/apiBase'
import styles from './PublicBlockRenderer.module.css'

export type Block = SharedBlock

// ─── Text blocks ──────────────────────────────────────────────────────────────

function HeadingBlock({ payload }: BlockRendererProps<HeadingPayload>) {
  const text = payload.text ?? ''
  const level = payload.level ?? 2
  const Tag = `h${Math.min(Math.max(level, 1), 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const alignment = payload.alignment ?? 'left'
  const weight = payload.weight ?? 'bold'
  const italic = payload.italic
  const underline = payload.underline
  const link = payload.link
  const style: CSSProperties = {
    textAlign: alignment as CSSProperties['textAlign'],
    fontWeight: weight === 'bold' ? 700 : weight === 'light' ? 300 : 400,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
  }
  const content = link
    ? <a href={link.url} target={link.newTab ? '_blank' : undefined} rel="noreferrer">{text}</a>
    : text
  return <Tag className={`${styles.heading} ${styles[`h${level}`]}`} style={style}>{content}</Tag>
}

function ParagraphBlock({ payload }: BlockRendererProps<ParagraphPayload>) {
  const html = payload.html ?? ''
  const alignment = payload.alignment ?? 'left'
  const weight = payload.weight ?? 'normal'
  const italic = payload.italic
  const underline = payload.underline
  const style: CSSProperties = {
    textAlign: alignment as CSSProperties['textAlign'],
    fontWeight: weight === 'bold' ? 700 : weight === 'light' ? 300 : 400,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
  }
  return (
    <div
      className={styles.paragraph}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}

function NumberedListBlock({ payload }: BlockRendererProps<{ items: string[] }>) {
  const items = payload.items ?? []
  return (
    <ol className={styles.list}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  )
}

function BulletedListBlock({ payload }: BlockRendererProps<{ items: string[] }>) {
  const items = payload.items ?? []
  return (
    <ul className={styles.list}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

function DetailBlock({ payload }: BlockRendererProps<DetailPayload>) {
  const summary = payload.summary ?? ''
  const body = payload.body ?? ''
  return (
    <details className={styles.detail}>
      <summary className={styles.detailSummary}>{summary}</summary>
      <div className={styles.detailBody} dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />
    </details>
  )
}

// ─── Media blocks ─────────────────────────────────────────────────────────────

function ImageBlock({ payload }: BlockRendererProps<ImagePayload>) {
  const src = payload.src ?? ''
  const alt = payload.alt ?? ''
  const caption = payload.caption
  return (
    <figure className={styles.figure}>
      <img src={src} alt={alt} className={styles.image} loading="lazy" />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  )
}

function VideoBlock({ payload }: BlockRendererProps<VideoPayload>) {
  const src = payload.src ?? ''
  const title = payload.title ?? 'Video'
  const poster = payload.posterSrc
  return (
    <div className={styles.videoWrapper}>
      <video
        src={src}
        title={title}
        poster={poster}
        controls
        className={styles.video}
        preload="metadata"
      />
    </div>
  )
}

function AudioBlock({ payload }: BlockRendererProps<{ src?: string; title?: string }>) {
  const src = payload.src ?? ''
  const title = payload.title ?? 'Audio'
  return (
    <figure className={styles.audioFigure}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <audio src={src} controls className={styles.audio} />
    </figure>
  )
}

// ─── Design blocks ────────────────────────────────────────────────────────────

function AccordionBlock({ payload }: BlockRendererProps<AccordionPayload>) {
  const normalized = normalizeAccordionPayload(payload)

  if (normalized.visible === false) {
    return null
  }

  return (
    <div className={styles.accordion}>
      {normalized.title ? <h3 className={styles.h3}>{normalized.title}</h3> : null}
      {normalized.panels.map((item) => (
        <details key={item.id} open={item.defaultOpen} className={styles.accordionItem}>
          <summary className={styles.accordionSummary}>{item.title}</summary>
          <div className={styles.accordionBody}>
            <PublicBlockRenderer blocks={item.blocks as Block[]} />
          </div>
        </details>
      ))}
    </div>
  )
}

function ButtonsBlock({ payload }: BlockRendererProps<{ buttons?: Array<{ label: string; url: string; variant: 'primary' | 'secondary' | 'ghost'; newTab?: boolean }>; alignment?: string }>) {
  const buttons = payload.buttons ?? []
  const alignment = payload.alignment ?? 'left'
  const justifyMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' }
  return (
    <div className={styles.buttons} style={{ justifyContent: justifyMap[alignment] ?? 'flex-start' }}>
      {buttons.map((btn, i) => (
        <a
          key={i}
          href={btn.url}
          target={btn.newTab ? '_blank' : undefined}
          rel="noreferrer"
          className={`${styles.btn} ${styles[`btn${btn.variant ? btn.variant.charAt(0).toUpperCase() + btn.variant.slice(1) : 'Primary'}`]}`}
        >
          {btn.label}
        </a>
      ))}
    </div>
  )
}

function SeparatorBlock({ payload }: BlockRendererProps<{ style?: string; thickness?: number; color?: string }>) {
  const borderStyle = payload.style ?? 'solid'
  const thickness = payload.thickness ?? 1
  const color = payload.color ?? 'var(--color-border)'
  return (
    <hr
      className={styles.separator}
      style={{ borderTopStyle: borderStyle as CSSProperties['borderTopStyle'], borderTopWidth: `${thickness}px`, borderTopColor: color }}
    />
  )
}

function SpacerBlock({ payload }: BlockRendererProps<{ height?: number }>) {
  const height = payload.height ?? 48
  return <div className={styles.spacer} style={{ height: `${height}px` }} aria-hidden />
}

// ─── Callout + Divider ────────────────────────────────────────────────────────

const calloutVariants: Record<string, string> = {
  info: styles.calloutInfo,
  tip: styles.calloutTip,
  warning: styles.calloutWarning,
  danger: styles.calloutDanger,
}

const calloutIcons: Record<string, string> = {
  info: 'ℹ',
  tip: '💡',
  warning: '⚠',
  danger: '🚨',
}

function CalloutBlock({ payload }: BlockRendererProps<CalloutPayload>) {
  const type = payload.type ?? 'info'
  const title = payload.title
  const body = payload.body ?? ''
  return (
    <div className={`${styles.callout} ${calloutVariants[type] ?? styles.calloutInfo}`}>
      <span className={styles.calloutIcon} aria-hidden>{calloutIcons[type] ?? 'ℹ'}</span>
      <div className={styles.calloutBody}>
        {title && <strong className={styles.calloutTitle}>{title}</strong>}
        <p className={styles.calloutText}>{body}</p>
      </div>
    </div>
  )
}

function CodeBlock({ payload }: BlockRendererProps<CodePayload>) {
  const code = payload.code ?? ''
  const language = payload.language ?? ''
  const filename = payload.filename
  return (
    <figure className={styles.codeFigure}>
      {filename && <figcaption className={styles.codeFilename}>{filename}</figcaption>}
      <pre className={styles.pre}>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </figure>
  )
}

function DividerBlock(_props: BlockRendererProps<DividerPayload>) {
  return <hr className={styles.divider} />
}

// ─── Video embed block ────────────────────────────────────────────────────────

function VideoEmbedBlock({ payload }: BlockRendererProps<VideoEmbedPayload>) {
  const url = payload.url ?? ''
  const title = payload.title ?? 'Video'
  const aspectRatio = payload.aspectRatio ?? '16:9'
  const paddingMap: Record<string, string> = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%' }
  const paddingTop = paddingMap[aspectRatio] ?? '56.25%'

  // Convert YouTube/Vimeo watch URLs to embed URLs
  let embedUrl = url
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/)
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return (
    <div className={styles.embedWrapper} style={{ paddingTop }}>
      <iframe
        src={embedUrl}
        title={title}
        className={styles.embed}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// ─── Hero block ───────────────────────────────────────────────────────────────

function HeroBlock({ payload }: BlockRendererProps<{ layout?: string; height?: string; heading?: string; subheading?: string; body?: string; ctaLabel?: string; ctaUrl?: string; backgroundImage?: string; overlayOpacity?: number; backgroundColor?: string; textColor?: string }>) {
  const layout = payload.layout ?? 'left'
  const height = payload.height ?? 'medium'
  const heading = payload.heading ?? ''
  const subheading = payload.subheading
  const body = payload.body
  const ctaLabel = payload.ctaLabel
  const ctaUrl = payload.ctaUrl
  const backgroundImage = payload.backgroundImage
  const overlayOpacity = payload.overlayOpacity ?? 40
  const backgroundColor = payload.backgroundColor ?? '#1a1a2e'
  const textColor = payload.textColor ?? 'light'

  const heightMap: Record<string, string> = {
    small: '40vh',
    medium: '60vh',
    large: '80vh',
    full: '100vh',
  }
  const alignMap: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }
  const textAlignMap: Record<string, CSSProperties['textAlign']> = {
    left: 'left',
    center: 'center',
    right: 'right',
  }

  return (
    <div
      className={styles.hero}
      style={{
        minHeight: heightMap[height] ?? '60vh',
        backgroundColor,
      }}
    >
      {backgroundImage && (
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      {backgroundImage && (
        <div
          className={styles.heroOverlay}
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      <div
        className={`${styles.heroContent} ${textColor === 'dark' ? styles.heroDark : styles.heroLight}`}
        style={{ alignItems: alignMap[layout] ?? 'flex-start', textAlign: textAlignMap[layout] ?? 'left' }}
      >
        {heading && <h1 className={styles.heroHeading}>{heading}</h1>}
        {subheading && <p className={styles.heroSubheading}>{subheading}</p>}
        {body && <p className={styles.heroBody}>{body}</p>}
        {ctaLabel && ctaUrl && (
          <a href={ctaUrl} className={styles.heroCta}>{ctaLabel}</a>
        )}
      </div>
    </div>
  )
}

// ─── Grid block ───────────────────────────────────────────────────────────────

function GridBlock({ payload }: BlockRendererProps<GridPayload>) {
  const columns = payload.columns ?? 2
  const cells = payload.cells ?? []

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {cells.map((cell) => (
        <div key={cell.id} className={styles.gridCell}>
          {cell.blocks.length === 0 ? (
            <div className={styles.gridCellEmpty} />
          ) : (
            <PublicBlockRenderer blocks={cell.blocks as Block[]} />
          )}
        </div>
      ))}
    </div>
  )
}

function ColumnsBlock({ payload }: BlockRendererProps<ColumnsPayload>) {
  const normalized = normalizeColumnsPayload(payload)
  const gapMap: Record<string, string> = { sm: '0.75rem', md: '1rem', lg: '1.5rem' }

  return (
    <div
      className={styles.columns}
      style={{ gridTemplateColumns: `repeat(${normalized.columns}, minmax(0, 1fr))`, gap: gapMap[normalized.gap ?? 'md'] }}
    >
      {normalized.items.map((column) => (
        <div
          key={column.id}
          className={`${styles.column} ${column.showOnMobile === false ? styles.columnHiddenMobile : ''}`}
        >
          {column.blocks.length === 0
            ? <div className={styles.gridCellEmpty} />
            : <PublicBlockRenderer blocks={column.blocks as Block[]} />
          }
        </div>
      ))}
    </div>
  )
}

// ─── Quiz block ───────────────────────────────────────────────────────────────

function QuizBlock({ payload }: BlockRendererProps<QuizPayload>) {
  const question = payload.question ?? ''
  const options = payload.options ?? []
  return (
    <div className={styles.quiz}>
      <p className={styles.quizQuestion}>{question}</p>
      <ul className={styles.quizOptions}>
        {options.map((opt) => (
          <li key={opt.id} className={styles.quizOption}>{opt.label}</li>
        ))}
      </ul>
    </div>
  )
}

// ─── Form block ───────────────────────────────────────────────────────────────

type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select'

interface FormFieldDef {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  fullWidth?: boolean
}

function FormBlock({ payload }: BlockRendererProps<FormPayload>) {
  const location = useLocation()
  const title = payload.title
  const fields = (payload.fields as FormFieldDef[]) ?? []
  const layout = payload.layout ?? '1col'
  const labelPosition = payload.labelPosition ?? 'above'
  const submitLabel = payload.submitLabel || 'Submit'
  const cols = layout === '2col' ? 2 : 1

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorActionUrl, setErrorActionUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const path = location.pathname.replace(/\/+$/, '') || '/'

    if (path !== '/sign-up') {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    setError(null)
    setErrorActionUrl(null)
    try {
      const formData = new FormData(form)
      const submissionFields = fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        value: String(formData.get(field.id) ?? ''),
      }))

      const res = await fetch(`${apiBase()}/api/signup-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: path,
          formTitle: title,
          fields: submissionFields,
        }),
      })

      const data = await res.json().catch(() => ({})) as { error?: string; resetPasswordUrl?: string }
      if (!res.ok) {
        setErrorActionUrl(data.resetPasswordUrl ?? null)
        throw new Error(data.error || `Sign-up request failed (${res.status})`)
      }

      form.reset()
      setSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit the form right now')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.formSuccess}>
        <span className={styles.formSuccessIcon}>✓</span>
        <p className={styles.formSuccessText}>Thank you! Your submission has been received.</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {title && <h3 className={styles.formTitle}>{title}</h3>}
      <div
        className={styles.formGrid}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {fields.map((field) => (
          <div
            key={field.id}
            className={`${styles.formField} ${field.fullWidth ? styles.formFieldFull : ''} ${labelPosition === 'inline' ? styles.formFieldInline : ''}`}
          >
            <label className={styles.formLabel} htmlFor={`field-${field.id}`}>
              {field.label || 'Field'}
              {field.required && <span className={styles.formRequired} aria-hidden>*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`field-${field.id}`}
                name={field.id}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className={styles.formControl}
              />
            ) : field.type === 'select' ? (
              <select
                id={`field-${field.id}`}
                name={field.id}
                required={field.required}
                className={styles.formControl}
                defaultValue=""
              >
                <option value="" disabled>{field.placeholder || 'Select an option'}</option>
                {(field.options ?? []).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${field.id}`}
                name={field.id}
                type={field.type === 'phone' ? 'tel' : field.type}
                placeholder={field.placeholder}
                required={field.required}
                className={styles.formControl}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      {errorActionUrl && (
        <p className={styles.formErrorAction}>
          <a href={errorActionUrl} target="_blank" rel="noreferrer">
            Reset password
          </a>
        </p>
      )}
      {fields.length > 0 && (
        <div className={styles.formActions}>
          <button type="submit" className={styles.formSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : submitLabel}
          </button>
        </div>
      )}
    </form>
  )
}

let registered = false

export function registerPublicBlocks(): void {
  if (registered) return
  registered = true

  registerBlock({
    type: BlockType.HEADING,
    group: BlockGroup.TEXT,
    label: 'Heading',
    icon: 'H',
    payloadSchema: HeadingPayloadSchema,
    defaultPayload: { text: '', level: 2 },
    Renderer: HeadingBlock,
  })

  registerBlock({
    type: BlockType.PARAGRAPH,
    group: BlockGroup.TEXT,
    label: 'Paragraph',
    icon: 'P',
    payloadSchema: ParagraphPayloadSchema,
    defaultPayload: { html: '' },
    Renderer: ParagraphBlock,
  })

  registerBlock({
    type: BlockType.NUMBERED_LIST,
    group: BlockGroup.TEXT,
    label: 'Numbered list',
    icon: '1.',
    payloadSchema: BulletedListPayloadSchema,
    defaultPayload: { items: [] },
    Renderer: NumberedListBlock,
  })

  registerBlock({
    type: BlockType.BULLETED_LIST,
    group: BlockGroup.TEXT,
    label: 'Bulleted list',
    icon: '•',
    payloadSchema: NumberedListPayloadSchema,
    defaultPayload: { items: [] },
    Renderer: BulletedListBlock,
  })

  registerBlock({
    type: BlockType.DETAIL,
    group: BlockGroup.TEXT,
    label: 'Detail',
    icon: '▸',
    payloadSchema: DetailPayloadSchema,
    defaultPayload: { summary: '', body: '' },
    Renderer: DetailBlock,
  })

  registerBlock({
    type: BlockType.IMAGE,
    group: BlockGroup.MEDIA,
    label: 'Image',
    icon: '🖼',
    payloadSchema: ImagePayloadSchema,
    defaultPayload: { src: '', alt: '' },
    Renderer: ImageBlock,
  })

  registerBlock({
    type: BlockType.VIDEO,
    group: BlockGroup.MEDIA,
    label: 'Video',
    icon: '▶',
    payloadSchema: VideoPayloadSchema,
    defaultPayload: { src: '', title: '' },
    Renderer: VideoBlock,
  })

  registerBlock({
    type: BlockType.AUDIO,
    group: BlockGroup.MEDIA,
    label: 'Audio',
    icon: '♪',
    payloadSchema: { parse: (data: unknown) => data, safeParse: (data: unknown) => ({ success: true, data }) },
    defaultPayload: {},
    Renderer: AudioBlock,
  })

  registerBlock({
    type: BlockType.ACCORDION,
    group: BlockGroup.DESIGN,
    label: 'Accordion',
    icon: '≡',
    payloadSchema: AccordionPayloadSchema,
    defaultPayload: { panels: [] },
    Renderer: AccordionBlock,
  })

  registerBlock({
    type: BlockType.BUTTONS,
    group: BlockGroup.DESIGN,
    label: 'Buttons',
    icon: '⊡',
    payloadSchema: { parse: (data: unknown) => data, safeParse: (data: unknown) => ({ success: true, data }) },
    defaultPayload: { buttons: [] },
    Renderer: ButtonsBlock,
  })

  registerBlock({
    type: BlockType.SEPARATOR,
    group: BlockGroup.DESIGN,
    label: 'Separator',
    icon: '─',
    payloadSchema: { parse: (data: unknown) => data, safeParse: (data: unknown) => ({ success: true, data }) },
    defaultPayload: {},
    Renderer: SeparatorBlock,
  })

  registerBlock({
    type: BlockType.SPACER,
    group: BlockGroup.DESIGN,
    label: 'Spacer',
    icon: '↕',
    payloadSchema: { parse: (data: unknown) => data, safeParse: (data: unknown) => ({ success: true, data }) },
    defaultPayload: { height: 48 },
    Renderer: SpacerBlock,
  })

  registerBlock({
    type: BlockType.CALLOUT,
    group: BlockGroup.LEARNING,
    label: 'Callout',
    icon: '!',
    payloadSchema: CalloutPayloadSchema,
    defaultPayload: { type: 'info', body: '' },
    Renderer: CalloutBlock,
  })

  registerBlock({
    type: BlockType.CODE,
    group: BlockGroup.TEXT,
    label: 'Code',
    icon: '</>',
    payloadSchema: CodePayloadSchema,
    defaultPayload: { code: '', language: '' },
    Renderer: CodeBlock,
  })

  registerBlock({
    type: BlockType.DIVIDER,
    group: BlockGroup.DESIGN,
    label: 'Divider',
    icon: '─',
    payloadSchema: DividerPayloadSchema,
    defaultPayload: {},
    Renderer: DividerBlock,
  })

  registerBlock({
    type: BlockType.QUIZ,
    group: BlockGroup.LEARNING,
    label: 'Quiz',
    icon: '?',
    payloadSchema: QuizPayloadSchema,
    defaultPayload: { question: '', options: [], correctOptionId: '' },
    Renderer: QuizBlock,
  })

  registerBlock({
    type: BlockType.VIDEO_EMBED,
    group: BlockGroup.MEDIA,
    label: 'Video embed',
    icon: '▶︎',
    payloadSchema: VideoEmbedPayloadSchema,
    defaultPayload: { url: '', aspectRatio: '16:9' },
    Renderer: VideoEmbedBlock,
  })

  registerBlock({
    type: BlockType.HERO,
    group: BlockGroup.DESIGN,
    label: 'Hero',
    icon: '⬛',
    payloadSchema: { parse: (data: unknown) => data, safeParse: (data: unknown) => ({ success: true, data }) },
    defaultPayload: {},
    Renderer: HeroBlock,
  })

  registerBlock({
    type: BlockType.GRID,
    group: BlockGroup.DESIGN,
    label: 'Grid',
    icon: '⊞',
    payloadSchema: GridPayloadSchema,
    defaultPayload: { columns: 2, rows: 1, cells: [] },
    Renderer: GridBlock,
  })

  registerBlock({
    type: BlockType.COLUMNS,
    group: BlockGroup.DESIGN,
    label: 'Columns',
    icon: '⫾',
    payloadSchema: ColumnsPayloadSchema,
    defaultPayload: normalizeColumnsPayload({ columns: 2, gap: 'md' }) as ColumnsPayload,
    Renderer: ColumnsBlock,
  })

  registerBlock({
    type: BlockType.FORM,
    group: BlockGroup.FORMS,
    label: 'Form',
    icon: '⊟',
    payloadSchema: FormPayloadSchema,
    defaultPayload: { fields: [] },
    Renderer: FormBlock,
  })
}

function renderRegisteredBlock(block: Block) {
  if (!isRegisteredBlockType(block.type)) {
    return null
  }

  const definition = getBlock(block.type)
  if (!definition) {
    return null
  }

  const { Renderer } = definition
  return <Renderer key={block.id} payload={block.payload} blockId={block.id} />
}

// ─── Public component ─────────────────────────────────────────────────────────

interface PublicBlockRendererProps {
  blocks: Block[]
}

export function PublicBlockRenderer({ blocks }: PublicBlockRendererProps) {
  registerPublicBlocks()

  return (
    <div className={styles.root}>
      {blocks.map(renderRegisteredBlock)}
    </div>
  )
}
