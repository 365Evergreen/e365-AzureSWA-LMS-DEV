import styles from './PublicBlockRenderer.module.css'

interface Block {
  id: string
  type: string
  version: number
  payload: Record<string, unknown>
}

// ─── Individual block renderers ───────────────────────────────────────────────

function HeadingBlock({ payload }: { payload: Record<string, unknown> }) {
  const text = (payload.text as string) ?? ''
  const level = (payload.level as number) ?? 2
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
  return <Tag className={`${styles.heading} ${styles[`h${level}`]}`}>{text}</Tag>
}

function ParagraphBlock({ payload }: { payload: Record<string, unknown> }) {
  const html = (payload.html as string) ?? ''
  return (
    <div
      className={styles.paragraph}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

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

// ─── Router ───────────────────────────────────────────────────────────────────

function renderBlock(block: Block) {
  switch (block.type) {
    case 'heading':   return <HeadingBlock key={block.id} payload={block.payload} />
    case 'paragraph': return <ParagraphBlock key={block.id} payload={block.payload} />
    case 'image':     return <ImageBlock key={block.id} payload={block.payload} />
    case 'video':     return <VideoBlock key={block.id} payload={block.payload} />
    case 'callout':   return <CalloutBlock key={block.id} payload={block.payload} />
    case 'code':      return <CodeBlock key={block.id} payload={block.payload} />
    case 'divider':   return <DividerBlock key={block.id} />
    default:          return null
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
