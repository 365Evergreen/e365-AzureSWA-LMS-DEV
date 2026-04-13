import { normalizeColumnsPayload } from '@lms/block-registry'
import { useState } from 'react'
import styles from './PublicBlockRenderer.module.css'

export interface Block {
  id: string
  type: string
  version: number
  payload: Record<string, unknown>
}

// ─── Text blocks ──────────────────────────────────────────────────────────────

function HeadingBlock({ id, payload }: { id: string; payload: Record<string, unknown> }) {
  const text = (payload.text as string) ?? ''
  const level = (payload.level as number) ?? 2
  const Tag = `h${Math.min(Math.max(level, 1), 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const alignment = (payload.alignment as string) ?? 'left'
  const weight = (payload.weight as string) ?? 'bold'
  const italic = payload.italic as boolean | undefined
  const underline = payload.underline as boolean | undefined
  const link = payload.link as { url: string; newTab?: boolean } | undefined
  const style: React.CSSProperties = {
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: weight === 'bold' ? 700 : weight === 'light' ? 300 : 400,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
  }
  const content = link
    ? <a href={link.url} target={link.newTab ? '_blank' : undefined} rel="noreferrer">{text}</a>
    : text
  return <Tag key={id} className={`${styles.heading} ${styles[`h${level}`]}`} style={style}>{content}</Tag>
}

function ParagraphBlock({ payload }: { payload: Record<string, unknown> }) {
  const html = (payload.html as string) ?? ''
  const alignment = (payload.alignment as string) ?? 'left'
  const weight = (payload.weight as string) ?? 'normal'
  const italic = payload.italic as boolean | undefined
  const underline = payload.underline as boolean | undefined
  const style: React.CSSProperties = {
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: weight === 'bold' ? 700 : weight === 'light' ? 300 : 400,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
  }
  return (
    <div
      className={styles.paragraph}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function NumberedListBlock({ payload }: { payload: Record<string, unknown> }) {
  const items = (payload.items as string[]) ?? []
  return (
    <ol className={styles.list}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  )
}

function BulletedListBlock({ payload }: { payload: Record<string, unknown> }) {
  const items = (payload.items as string[]) ?? []
  return (
    <ul className={styles.list}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

function DetailBlock({ payload }: { payload: Record<string, unknown> }) {
  const summary = (payload.summary as string) ?? ''
  const body = (payload.body as string) ?? ''
  return (
    <details className={styles.detail}>
      <summary className={styles.detailSummary}>{summary}</summary>
      <div className={styles.detailBody} dangerouslySetInnerHTML={{ __html: body }} />
    </details>
  )
}

// ─── Media blocks ─────────────────────────────────────────────────────────────

function ImageBlock({ payload }: { payload: Record<string, unknown> }) {
  const src = (payload.src as string) ?? ''
  const alt = (payload.alt as string) ?? ''
  const caption = payload.caption as string | undefined
  return (
    <figure className={styles.figure}>
      <img src={src} alt={alt} className={styles.image} loading="lazy" />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  )
}

function VideoBlock({ payload }: { payload: Record<string, unknown> }) {
  const src = (payload.src as string) ?? ''
  const title = (payload.title as string) ?? 'Video'
  const poster = payload.posterSrc as string | undefined
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

function AudioBlock({ payload }: { payload: Record<string, unknown> }) {
  const src = (payload.src as string) ?? ''
  const title = (payload.title as string) ?? 'Audio'
  return (
    <figure className={styles.audioFigure}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <audio src={src} controls className={styles.audio} />
    </figure>
  )
}

// ─── Design blocks ────────────────────────────────────────────────────────────

function AccordionBlock({ payload }: { payload: Record<string, unknown> }) {
  type AccordionPanel = {
    id: string
    title: string
    defaultOpen?: boolean
    blocks: Block[]
  }

  const normalized = (() => {
    if (Array.isArray(payload.panels)) {
      return {
        title: (payload.title as string | undefined) ?? '',
        visible: payload.visible as boolean | undefined,
        panels: payload.panels as AccordionPanel[],
      }
    }

    const legacyItems = (payload.items as Array<{ title?: string; body?: string; defaultOpen?: boolean }>) ?? []
    return {
      title: '',
      visible: true,
      panels: legacyItems.map((item, index) => ({
        id: `legacy-panel-${index}`,
        title: item.title ?? `Panel ${index + 1}`,
        defaultOpen: item.defaultOpen,
        blocks: item.body
          ? [{ id: `legacy-panel-${index}-body`, type: 'paragraph', version: 1, payload: { html: item.body } }]
          : [],
      })),
    }
  })()

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
            {item.blocks.map(renderBlock)}
          </div>
        </details>
      ))}
    </div>
  )
}

function ButtonsBlock({ payload }: { payload: Record<string, unknown> }) {
  type Btn = { label: string; url: string; variant: 'primary' | 'secondary' | 'ghost'; newTab?: boolean }
  const buttons = (payload.buttons as Btn[]) ?? []
  const alignment = (payload.alignment as string) ?? 'left'
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

function SeparatorBlock({ payload }: { payload: Record<string, unknown> }) {
  const borderStyle = (payload.style as string) ?? 'solid'
  const thickness = (payload.thickness as number) ?? 1
  const color = (payload.color as string) ?? 'var(--color-border)'
  return (
    <hr
      className={styles.separator}
      style={{ borderTopStyle: borderStyle as React.CSSProperties['borderTopStyle'], borderTopWidth: `${thickness}px`, borderTopColor: color }}
    />
  )
}

function SpacerBlock({ payload }: { payload: Record<string, unknown> }) {
  const height = (payload.height as number) ?? 48
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

function CalloutBlock({ payload }: { payload: Record<string, unknown> }) {
  const type = (payload.type as string) ?? 'info'
  const title = payload.title as string | undefined
  const body = (payload.body as string) ?? ''
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

function CodeBlock({ payload }: { payload: Record<string, unknown> }) {
  const code = (payload.code as string) ?? ''
  const language = (payload.language as string) ?? ''
  const filename = payload.filename as string | undefined
  return (
    <figure className={styles.codeFigure}>
      {filename && <figcaption className={styles.codeFilename}>{filename}</figcaption>}
      <pre className={styles.pre}>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </figure>
  )
}

function DividerBlock() {
  return <hr className={styles.divider} />
}

// ─── Video embed block ────────────────────────────────────────────────────────

function VideoEmbedBlock({ payload }: { payload: Record<string, unknown> }) {
  const url = (payload.url as string) ?? ''
  const title = (payload.title as string) ?? 'Video'
  const aspectRatio = (payload.aspectRatio as string) ?? '16:9'
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

function HeroBlock({ payload }: { payload: Record<string, unknown> }) {
  const layout = (payload.layout as string) ?? 'left'
  const height = (payload.height as string) ?? 'medium'
  const heading = (payload.heading as string) ?? ''
  const subheading = payload.subheading as string | undefined
  const body = payload.body as string | undefined
  const ctaLabel = payload.ctaLabel as string | undefined
  const ctaUrl = payload.ctaUrl as string | undefined
  const backgroundImage = payload.backgroundImage as string | undefined
  const overlayOpacity = (payload.overlayOpacity as number) ?? 40
  const backgroundColor = (payload.backgroundColor as string) ?? '#1a1a2e'
  const textColor = (payload.textColor as string) ?? 'light'

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
  const textAlignMap: Record<string, React.CSSProperties['textAlign']> = {
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

function GridBlock({ payload }: { payload: Record<string, unknown> }) {
  type CellBlock = { id: string; type: string; payload: Record<string, unknown> }
  type Cell = { id: string; blocks: CellBlock[] }
  const columns = (payload.columns as number) ?? 2
  const cells = (payload.cells as Cell[]) ?? []

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
            cell.blocks.map((b) => renderBlock(b as Block))
          )}
        </div>
      ))}
    </div>
  )
}

function ColumnsBlock({ payload }: { payload: Record<string, unknown> }) {
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
            : column.blocks.map((block) => renderBlock(block as Block))
          }
        </div>
      ))}
    </div>
  )
}

// ─── Quiz block ───────────────────────────────────────────────────────────────

function QuizBlock({ payload }: { payload: Record<string, unknown> }) {
  type Option = { id: string; label: string }
  const question = (payload.question as string) ?? ''
  const options = (payload.options as Option[]) ?? []
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

function FormBlock({ payload }: { payload: Record<string, unknown> }) {
  const title = payload.title as string | undefined
  const fields = (payload.fields as FormFieldDef[]) ?? []
  const layout = (payload.layout as string) ?? '1col'
  const labelPosition = (payload.labelPosition as string) ?? 'above'
  const submitLabel = (payload.submitLabel as string) || 'Submit'
  const cols = layout === '2col' ? 2 : 1

  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
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
      {fields.length > 0 && (
        <div className={styles.formActions}>
          <button type="submit" className={styles.formSubmit}>
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

function renderBlock(block: Block) {
  const p = block.payload
  switch (block.type) {
    case 'heading':        return <HeadingBlock key={block.id} id={block.id} payload={p} />
    case 'paragraph':      return <ParagraphBlock key={block.id} payload={p} />
    case 'numbered-list':  return <NumberedListBlock key={block.id} payload={p} />
    case 'bulleted-list':  return <BulletedListBlock key={block.id} payload={p} />
    case 'detail':         return <DetailBlock key={block.id} payload={p} />
    case 'image':          return <ImageBlock key={block.id} payload={p} />
    case 'video':          return <VideoBlock key={block.id} payload={p} />
    case 'audio':          return <AudioBlock key={block.id} payload={p} />
    case 'callout':        return <CalloutBlock key={block.id} payload={p} />
    case 'code':           return <CodeBlock key={block.id} payload={p} />
    case 'accordion':      return <AccordionBlock key={block.id} payload={p} />
    case 'buttons':        return <ButtonsBlock key={block.id} payload={p} />
    case 'separator':      return <SeparatorBlock key={block.id} payload={p} />
    case 'spacer':         return <SpacerBlock key={block.id} payload={p} />
    case 'divider':        return <DividerBlock key={block.id} />
    case 'quiz':           return <QuizBlock key={block.id} payload={p} />
    case 'video-embed':    return <VideoEmbedBlock key={block.id} payload={p} />
    case 'hero':           return <HeroBlock key={block.id} payload={p} />
    case 'grid':           return <GridBlock key={block.id} payload={p} />
    case 'columns':        return <ColumnsBlock key={block.id} payload={p} />
    case 'form':           return <FormBlock key={block.id} payload={p} />
    default:               return null
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

interface PublicBlockRendererProps {
  blocks: Block[]
}

export function PublicBlockRenderer({ blocks }: PublicBlockRendererProps) {
  return (
    <div className={styles.root}>
      {blocks.map(renderBlock)}
    </div>
  )
}
