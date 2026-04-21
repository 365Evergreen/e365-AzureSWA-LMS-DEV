import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import BlockPalette from '../../components/BlockPalette';
import BlockCanvas from '../../components/BlockCanvas';
import BlockPropertyEditor from '../../components/BlockPropertyEditor';
import CoursePropertiesPane from '../../components/CoursePropertiesPane';
import LayoutPropertiesPane from '../../components/LayoutPropertiesPane';
import ContentTypeModal from '../../components/ContentTypeModal';
import TemplateGallery from '../../components/TemplateGallery';
import CanvasLayoutPreview from '../../components/CanvasLayoutPreview';
import type { CourseProperties } from '../../components/CoursePropertiesPane/types';
import { defaultCourseProperties } from '../../components/CoursePropertiesPane/types';
import PublishBar from '../../components/PublishBar';
import { savePage } from '../../api/pages';
import styles from './EditorPage.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
  background?: string;
}

type ContentType = 'page' | 'post';
type NewContentStep = 'type' | 'template' | null;

interface EditorState {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  publishStatus: 'draft' | 'published';
  courseProperties: CourseProperties;
  rightTab: 'course' | 'block' | 'layout';
  newContentStep: NewContentStep;
  contentType: ContentType | null;
}

export default function EditorPage() {
  const [state, setState] = useState<EditorState>({
    blocks: [],
    selectedBlockId: null,
    publishStatus: 'draft',
    courseProperties: defaultCourseProperties,
    rightTab: 'layout',
    newContentStep: 'type',
    contentType: null,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, blocks: [...s.blocks, { id, type, payload }], rightTab: 'block' }));
  }

  function removeBlock(id: string) {
    setState((s) => ({
      ...s,
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
    }));
  }

  function selectBlock(id: string | null) {
    setState((s) => ({ ...s, selectedBlockId: id, rightTab: id ? 'block' : s.rightTab }));
  }

  function updateBlockPayload(id: string, payload: unknown) {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, payload } : b)),
    }));
  }

  function updateBlockBackground(id: string, background: string | undefined) {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, background } : b)),
    }));
  }

  function insertBlocksAfter(afterId: string, newBlocks: Array<{ type: BlockType; payload: unknown }>) {
    setState((s) => {
      const idx = s.blocks.findIndex((b) => b.id === afterId);
      const toInsert = newBlocks.map((nb) => ({ id: crypto.randomUUID(), type: nb.type, payload: nb.payload }));
      const updated = [...s.blocks];
      updated.splice(idx + 1, 0, ...toInsert);
      return { ...s, blocks: updated };
    });
  }

  function reorderBlocks(blocks: EditorBlock[]) {
    setState((s) => ({ ...s, blocks }));
  }

  function setCourseProperties(courseProperties: CourseProperties) {
    setState((s) => ({ ...s, courseProperties }));
  }

  function handleContentTypeSelect(type: ContentType) {
    if (type === 'post') {
      setState((s) => ({
        ...s,
        contentType: type,
        newContentStep: null,
        courseProperties: { ...s.courseProperties, templateId: 'post', contentWidth: undefined },
        rightTab: 'layout',
      }));
    } else {
      setState((s) => ({ ...s, contentType: type, newContentStep: 'template' }));
    }
  }

  function handleTemplateSelect(templateId: string) {
    setState((s) => ({
      ...s,
      newContentStep: null,
      courseProperties: { ...s.courseProperties, templateId, contentWidth: undefined },
      rightTab: 'layout',
    }));
  }

  function openNewContentFlow() {
    setState((s) => ({ ...s, newContentStep: 'type', contentType: null }));
  }

  async function handleSave(status: 'draft' | 'published') {
    const { courseProperties, blocks, contentType } = state;

    if (!courseProperties.slug) {
      setValidationError('Please set a slug in the Content tab before saving.');
      setState((s) => ({ ...s, rightTab: 'course' }));
      throw new Error('Slug is required');
    }
    if (!courseProperties.title) {
      setValidationError('Please set a title in the Content tab before saving.');
      setState((s) => ({ ...s, rightTab: 'course' }));
      throw new Error('Title is required');
    }

    setValidationError(null);

    const result = await savePage({
      slug: courseProperties.slug,
      title: courseProperties.title,
      description: courseProperties.description,
      templateId: courseProperties.templateId,
      contentType: contentType ?? 'page',
      blocks: blocks.map((b) => ({
        id: b.id,
        type: b.type,
        version: 1,
        payload: b.payload as Record<string, unknown>,
        background: b.background,
      })),
      status,
    });

    setState((s) => ({ ...s, publishStatus: result.status }));
  }

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) ?? null;
  const { templateId, contentWidth } = state.courseProperties;

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <aside className={styles.palette}>
          <BlockPalette onAddBlock={addBlock} />
        </aside>
        <main className={styles.canvas}>
          <CanvasLayoutPreview templateId={templateId} contentWidth={contentWidth}>
            <BlockCanvas
              blocks={state.blocks}
              selectedBlockId={state.selectedBlockId}
              onSelectBlock={selectBlock}
              onRemoveBlock={removeBlock}
              onReorderBlocks={reorderBlocks}
              onUpdatePayload={updateBlockPayload}
              onUpdateBackground={updateBlockBackground}
              onInsertBlocksAfter={insertBlocksAfter}
            />
          </CanvasLayoutPreview>
        </main>
        <aside className={styles.properties}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${state.rightTab === 'course' ? styles.tabActive : ''}`}
              onClick={() => setState((s) => ({ ...s, rightTab: 'course' }))}
            >
              Content
            </button>
            <button
              type="button"
              className={`${styles.tab} ${state.rightTab === 'layout' ? styles.tabActive : ''}`}
              onClick={() => setState((s) => ({ ...s, rightTab: 'layout' }))}
            >
              Layout
            </button>
            <button
              type="button"
              className={`${styles.tab} ${state.rightTab === 'block' ? styles.tabActive : ''}`}
              onClick={() => setState((s) => ({ ...s, rightTab: 'block' }))}
            >
              Block
            </button>
          </div>
          {validationError && (
            <div className={styles.validationError}>{validationError}</div>
          )}
          <div className={styles.tabContent}>
            {state.rightTab === 'course' && (
              <CoursePropertiesPane
                properties={state.courseProperties}
                onChange={setCourseProperties}
              />
            )}
            {state.rightTab === 'layout' && (
              <LayoutPropertiesPane
                templateId={templateId}
                contentWidth={contentWidth}
                onChangeTemplate={openNewContentFlow}
                onContentWidthChange={(w) =>
                  setCourseProperties({ ...state.courseProperties, contentWidth: w })
                }
              />
            )}
            {state.rightTab === 'block' && (
              <BlockPropertyEditor
                block={selectedBlock}
                onUpdatePayload={(payload) => {
                  if (selectedBlock) updateBlockPayload(selectedBlock.id, payload);
                }}
              />
            )}
          </div>
        </aside>
        <div className={styles.publishBar}>
          <PublishBar
            status={state.publishStatus}
            onSave={handleSave}
            onDiscard={() => { setState((s) => ({ ...s, blocks: [], publishStatus: 'draft' })); }}
          />
        </div>
      </div>

      {state.newContentStep === 'type' && (
        <ContentTypeModal
          onSelect={handleContentTypeSelect}
          onCancel={() => setState((s) => ({ ...s, newContentStep: null }))}
        />
      )}
      {state.newContentStep === 'template' && state.contentType === 'page' && (
        <TemplateGallery
          category="page"
          onSelect={handleTemplateSelect}
          onCancel={() => setState((s) => ({ ...s, newContentStep: 'type' }))}
        />
      )}
    </div>
  );
}

