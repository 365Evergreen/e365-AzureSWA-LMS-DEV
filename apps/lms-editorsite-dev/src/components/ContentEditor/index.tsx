import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BlockType } from '@lms/block-registry';
import AppNav from '../AppNav';
import BlockPalette from '../BlockPalette';
import BlockCanvas from '../BlockCanvas';
import BlockPropertyEditor from '../BlockPropertyEditor';
import CoursePropertiesPane from '../CoursePropertiesPane';
import LayoutPropertiesPane from '../LayoutPropertiesPane';
import TemplateGallery from '../TemplateGallery';
import CanvasLayoutPreview from '../CanvasLayoutPreview';
import NavPropertiesSection from '../NavPropertiesSection';
import type { CourseProperties } from '../CoursePropertiesPane/types';
import { defaultCourseProperties } from '../CoursePropertiesPane/types';
import PublishBar from '../PublishBar';
import { savePage } from '../../api/pages';
import type { SiteContentType } from '../../api/pages';
import styles from './ContentEditor.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

export interface ContentEditorInitialData {
  slug: string;
  title: string;
  description?: string;
  templateId: string;
  status: 'draft' | 'published';
  blocks: Array<{ id: string; type: BlockType; payload: unknown }>;
  inNav?: boolean;
  navLabel?: string;
  navParent?: string;
  navOrder?: number;
}

interface ContentEditorProps {
  contentType: SiteContentType;
  /** If omitted, the template gallery is shown first (for 'page' type). */
  defaultTemplateId?: string;
  /** Where to navigate after a successful save. Defaults to the parent list route. */
  returnPath?: string;
  /** Pre-populate the editor with existing page data (edit mode). */
  initialData?: ContentEditorInitialData;
}

interface EditorState {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  publishStatus: 'draft' | 'published';
  courseProperties: CourseProperties;
  rightTab: 'course' | 'block' | 'layout';
  showTemplateGallery: boolean;
}

export default function ContentEditor({ contentType, defaultTemplateId, returnPath, initialData }: ContentEditorProps) {
  const navigate = useNavigate();
  const initialTemplateId = initialData?.templateId ?? defaultTemplateId ?? (contentType === 'page' ? '' : 'post');
  const needsTemplateSelection = !initialData && !defaultTemplateId && contentType === 'page';

  const [state, setState] = useState<EditorState>({
    blocks: initialData?.blocks ?? [],
    selectedBlockId: null,
    publishStatus: initialData?.status ?? 'draft',
    courseProperties: initialData ? {
      ...defaultCourseProperties,
      slug: initialData.slug,
      title: initialData.title,
      description: initialData.description ?? '',
      templateId: initialData.templateId,
      status: initialData.status,
      inNav: initialData.inNav ?? false,
      navLabel: initialData.navLabel ?? '',
      navParent: initialData.navParent ?? '',
      navOrder: initialData.navOrder ?? 0,
    } : { ...defaultCourseProperties, templateId: initialTemplateId },
    rightTab: 'layout',
    showTemplateGallery: needsTemplateSelection,
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

  function handleTemplateSelect(templateId: string) {
    setState((s) => ({
      ...s,
      showTemplateGallery: false,
      courseProperties: { ...s.courseProperties, templateId, contentWidth: undefined },
      rightTab: 'layout',
    }));
  }

  async function handleSave(status: 'draft' | 'published') {
    const { courseProperties, blocks } = state;

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
      contentType,
      blocks: blocks.map((b) => ({
        id: b.id,
        type: b.type,
        version: 1,
        payload: b.payload as Record<string, unknown>,
      })),
      status,
      ...(contentType === 'page' ? {
        inNav: courseProperties.inNav,
        navLabel: courseProperties.navLabel || courseProperties.title,
        navParent: courseProperties.navParent || undefined,
        navOrder: courseProperties.navOrder,
      } : {}),
    });

    setState((s) => ({ ...s, publishStatus: result.status }));

    if (status === 'published' && returnPath) {
      navigate(returnPath);
    }
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
              onUpdatePayload={updateBlockPayload}
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
              <>
                <CoursePropertiesPane
                  properties={state.courseProperties}
                  onChange={setCourseProperties}
                />
                {contentType === 'page' && (
                  <NavPropertiesSection
                    properties={state.courseProperties}
                    onChange={setCourseProperties}
                  />
                )}
              </>
            )}
            {state.rightTab === 'layout' && (
              <LayoutPropertiesPane
                templateId={templateId}
                contentWidth={contentWidth}
                onChangeTemplate={() => setState((s) => ({ ...s, showTemplateGallery: true }))}
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
          <PublishBar status={state.publishStatus} onSave={handleSave} />
        </div>
      </div>

      {state.showTemplateGallery && (
        <TemplateGallery
          category="page"
          onSelect={handleTemplateSelect}
          onCancel={() => setState((s) => ({ ...s, showTemplateGallery: false }))}
        />
      )}
    </div>
  );
}
