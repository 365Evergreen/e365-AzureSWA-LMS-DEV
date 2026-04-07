import {
  registerBlock,
  BlockGroup,
  BlockType,
  HeadingPayloadSchema,
  ParagraphPayloadSchema,
  ImagePayloadSchema,
  VideoPayloadSchema,
  QuizPayloadSchema,
  CodePayloadSchema,
  CalloutPayloadSchema,
  DividerPayloadSchema,
} from '@lms/block-registry';
import { HeadingBlock } from '../components/blocks/HeadingBlock';
import { ParagraphBlock } from '../components/blocks/ParagraphBlock';
import { ImageBlock } from '../components/blocks/ImageBlock';
import { VideoBlock } from '../components/blocks/VideoBlock';
import { QuizBlock } from '../components/blocks/QuizBlock';
import { CodeBlock } from '../components/blocks/CodeBlock';
import { CalloutBlock } from '../components/blocks/CalloutBlock';
import { DividerBlock } from '../components/blocks/DividerBlock';

export function registerBlocks(): void {
  registerBlock({
    type: BlockType.HEADING,
    group: BlockGroup.TEXT,
    label: 'Heading',
    icon: 'H',
    payloadSchema: HeadingPayloadSchema,
    defaultPayload: { text: 'Heading', level: 1 },
    Renderer: HeadingBlock,
  });

  registerBlock({
    type: BlockType.PARAGRAPH,
    group: BlockGroup.TEXT,
    label: 'Paragraph',
    icon: 'P',
    payloadSchema: ParagraphPayloadSchema,
    defaultPayload: { html: '<p></p>' },
    Renderer: ParagraphBlock,
  });

  registerBlock({
    type: BlockType.IMAGE,
    group: BlockGroup.MEDIA,
    label: 'Image',
    icon: '🖼',
    payloadSchema: ImagePayloadSchema,
    defaultPayload: { src: 'https://placehold.co/800x400', alt: '' },
    Renderer: ImageBlock,
  });

  registerBlock({
    type: BlockType.VIDEO,
    group: BlockGroup.MEDIA,
    label: 'Video',
    icon: '▶',
    payloadSchema: VideoPayloadSchema,
    defaultPayload: { src: 'https://example.com/video.mp4', title: '' },
    Renderer: VideoBlock,
  });

  registerBlock({
    type: BlockType.QUIZ,
    group: BlockGroup.LEARNING,
    label: 'Quiz',
    icon: '❓',
    payloadSchema: QuizPayloadSchema,
    defaultPayload: {
      question: '',
      options: [],
      correctOptionId: '',
    },
    Renderer: QuizBlock,
  });

  registerBlock({
    type: BlockType.CODE,
    group: BlockGroup.TEXT,
    label: 'Code',
    icon: '</>',
    payloadSchema: CodePayloadSchema,
    defaultPayload: { code: '', language: 'typescript' },
    Renderer: CodeBlock,
  });

  registerBlock({
    type: BlockType.CALLOUT,
    group: BlockGroup.DESIGN,
    label: 'Callout',
    icon: '📢',
    payloadSchema: CalloutPayloadSchema,
    defaultPayload: { type: 'info', body: '' },
    Renderer: CalloutBlock,
  });

  registerBlock({
    type: BlockType.DIVIDER,
    group: BlockGroup.DESIGN,
    label: 'Divider',
    icon: '—',
    payloadSchema: DividerPayloadSchema,
    defaultPayload: {},
    Renderer: DividerBlock,
  });
}
