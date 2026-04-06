import {
  registerBlock,
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
    label: 'Heading',
    icon: 'H',
    payloadSchema: HeadingPayloadSchema,
    defaultPayload: { text: 'Heading', level: 1 },
    Renderer: HeadingBlock,
  });

  registerBlock({
    type: BlockType.PARAGRAPH,
    label: 'Paragraph',
    icon: 'P',
    payloadSchema: ParagraphPayloadSchema,
    defaultPayload: { html: '<p></p>' },
    Renderer: ParagraphBlock,
  });

  registerBlock({
    type: BlockType.IMAGE,
    label: 'Image',
    icon: '🖼',
    payloadSchema: ImagePayloadSchema,
    defaultPayload: { src: 'https://placehold.co/800x400', alt: '' },
    Renderer: ImageBlock,
  });

  registerBlock({
    type: BlockType.VIDEO,
    label: 'Video',
    icon: '▶',
    payloadSchema: VideoPayloadSchema,
    defaultPayload: { src: 'https://example.com/video.mp4', title: '' },
    Renderer: VideoBlock,
  });

  registerBlock({
    type: BlockType.QUIZ,
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
    label: 'Code',
    icon: '</>',
    payloadSchema: CodePayloadSchema,
    defaultPayload: { code: '', language: 'typescript' },
    Renderer: CodeBlock,
  });

  registerBlock({
    type: BlockType.CALLOUT,
    label: 'Callout',
    icon: '📢',
    payloadSchema: CalloutPayloadSchema,
    defaultPayload: { type: 'info', body: '' },
    Renderer: CalloutBlock,
  });

  registerBlock({
    type: BlockType.DIVIDER,
    label: 'Divider',
    icon: '—',
    payloadSchema: DividerPayloadSchema,
    defaultPayload: {},
    Renderer: DividerBlock,
  });
}
