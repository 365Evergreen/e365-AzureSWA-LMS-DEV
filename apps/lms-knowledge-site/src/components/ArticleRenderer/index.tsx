import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'
import React from 'react'
import styles from './ArticleRenderer.module.css'

interface ArticleRendererProps {
  content: string
}

const components: Components = {
  h1({ children }) {
    return <h1 className={styles.h1}>{children}</h1>
  },
  h2({ children }) {
    return <h2 className={styles.h2}>{children}</h2>
  },
  h3({ children }) {
    return <h3 className={styles.h3}>{children}</h3>
  },
  pre({ children }) {
    return <pre className={styles.pre}>{children}</pre>
  },
  code(props) {
    const { className, children } = props as { className?: string; children?: React.ReactNode }
    const isBlock = /language-/.test(className ?? '')
    return (
      <code className={[isBlock ? styles.codeBlock : styles.inlineCode, className].filter(Boolean).join(' ')}>
        {children}
      </code>
    )
  },
  blockquote({ children }) {
    return <blockquote className={styles.blockquote}>{children}</blockquote>
  },
  a({ href, children }) {
    return <a href={href} className={styles.link}>{children}</a>
  },
}

export default function ArticleRenderer({ content }: ArticleRendererProps) {
  return (
    <div className={styles.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
