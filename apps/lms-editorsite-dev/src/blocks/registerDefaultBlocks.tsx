import { registerBlock, BlockType, HeadingPayloadSchema, ParagraphPayloadSchema, ImagePayloadSchema, VideoPayloadSchema, QuizPayloadSchema, CodePayloadSchema, CalloutPayloadSchema, DividerPayloadSchema } from '@lms/block-registry';

export function registerDefaultBlocks(): void {
  registerBlock({
    type: BlockType.HEADING,
    label: 'Heading',
    icon: 'H',
    payloadSchema: HeadingPayloadSchema,
    defaultPayload: { text: 'New Heading', level: 2 },
    Renderer: ({ payload }) => {
      const Tag = `h${payload.level}` as 'h1' | 'h2' | 'h3' | 'h4';
      return <Tag>{payload.text}</Tag>;
    },
  });

  registerBlock({
    type: BlockType.PARAGRAPH,
    label: 'Paragraph',
    icon: '¶',
    payloadSchema: ParagraphPayloadSchema,
    defaultPayload: { html: '<p>New paragraph</p>' },
    Renderer: ({ payload }) => <div dangerouslySetInnerHTML={{ __html: payload.html }} />,
  });

  registerBlock({
    type: BlockType.IMAGE,
    label: 'Image',
    icon: '🖼',
    payloadSchema: ImagePayloadSchema,
    defaultPayload: { src: 'https://placehold.co/600x400', alt: 'Image', caption: '' },
    Renderer: ({ payload }) => (
      <figure>
        <img src={payload.src} alt={payload.alt} />
        {payload.caption && <figcaption>{payload.caption}</figcaption>}
      </figure>
    ),
  });

  registerBlock({
    type: BlockType.VIDEO,
    label: 'Video',
    icon: '▶',
    payloadSchema: VideoPayloadSchema,
    defaultPayload: { src: 'https://example.com/video.mp4', title: 'Video' },
    Renderer: ({ payload }) => (
      <figure>
        <video src={payload.src} controls poster={payload.posterSrc} title={payload.title} />
        <figcaption>{payload.title}</figcaption>
      </figure>
    ),
  });

  registerBlock({
    type: BlockType.QUIZ,
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
    },
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
    type: BlockType.CODE,
    label: 'Code',
    icon: '</>',
    payloadSchema: CodePayloadSchema,
    defaultPayload: { code: '// code here', language: 'javascript' },
    Renderer: ({ payload }) => (
      <pre>
        <code>{payload.code}</code>
      </pre>
    ),
  });

  registerBlock({
    type: BlockType.CALLOUT,
    label: 'Callout',
    icon: '!',
    payloadSchema: CalloutPayloadSchema,
    defaultPayload: { type: 'info', title: 'Note', body: 'Callout content' },
    Renderer: ({ payload }) => (
      <aside>
        {payload.title && <strong>{payload.title}</strong>}
        <p>{payload.body}</p>
      </aside>
    ),
  });

  registerBlock({
    type: BlockType.DIVIDER,
    label: 'Divider',
    icon: '─',
    payloadSchema: DividerPayloadSchema,
    defaultPayload: {},
    Renderer: () => <hr />,
  });
}
