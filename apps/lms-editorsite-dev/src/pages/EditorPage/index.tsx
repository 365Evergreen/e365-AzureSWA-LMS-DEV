import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import AppNav from '../../components/AppNav';
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
import styles from './EditorPage.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

type ContentType = 'page' | 'post';
type NewContentStep = 'type' | 'template' | null;

interface EditorState {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  publishStatus: 'draft' | 'review' | 'published';
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

  function reorderBlocks(blocks: EditorBlock[]) {
    setState((s) => ({ ...s, blocks }));
  }

  function setPublishStatus(status: EditorState['publishStatus']) {
    setState((s) => ({ ...s, publishStatus: status }));
  }

  function setCourseProperties(courseProperties: CourseProperties) {
    setState((s) => ({ ...s, courseProperties }));
  }

  function handleContentTypeSelect(type: ContentType) {
    if (type === 'post') {
      // Posts have a single template — skip the gallery
      setState((s) => ({
        ...s,
        contentType: type,
        newContentStep: null,
        courseProperties: { ...s.courseProperties, templateId: 'post', contentWidth: undefined },
        rightTab: 'layout',
      }));
    } else {
      // Pages need a template gallery
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

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) ?? null;
  const { templateId, contentWidth } = state.courseProperties;

  return (
    <div className={styles.root}>
      <AppNav />
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
          <PublishBar status={state.publishStatus} onStatusChange={setPublishStatus} />
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
