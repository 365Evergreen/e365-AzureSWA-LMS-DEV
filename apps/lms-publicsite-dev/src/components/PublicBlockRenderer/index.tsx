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
  type AccordionItem = { title: string; body: string; defaultOpen?: boolean }
  const items = (payload.items as AccordionItem[]) ?? []
  return (
    <div className={styles.accordion}>
      {items.map((item, i) => (
        <details key={i} open={item.defaultOpen} className={styles.accordionItem}>
          <summary className={styles.accordionSummary}>{item.title}</summary>
          <div
            className={styles.accordionBody}
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
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
    // Layout containers (columns, row, stack, grid, group) have no flat-list children — skip
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
