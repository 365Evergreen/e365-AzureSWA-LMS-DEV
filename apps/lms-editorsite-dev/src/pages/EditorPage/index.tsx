import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import AppNav from '../../components/AppNav';
import BlockPalette from '../../components/BlockPalette';
import BlockCanvas from '../../components/BlockCanvas';
import BlockPropertyEditor from '../../components/BlockPropertyEditor';
import PublishBar from '../../components/PublishBar';
import styles from './EditorPage.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

interface EditorState {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  publishStatus: 'draft' | 'review' | 'published';
}

export default function EditorPage() {
  const [state, setState] = useState<EditorState>({
    blocks: [],
    selectedBlockId: null,
    publishStatus: 'draft',
  });

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, blocks: [...s.blocks, { id, type, payload }] }));
  }

  function removeBlock(id: string) {
    setState((s) => ({
      ...s,
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
    }));
  }

  function selectBlock(id: string | null) {
    setState((s) => ({ ...s, selectedBlockId: id }));
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

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) ?? null;

  return (
    <div className={styles.root}>
      <AppNav />
      <div className={styles.layout}>
        <aside className={styles.palette}>
          <BlockPalette onAddBlock={addBlock} />
        </aside>
        <main className={styles.canvas}>
          <BlockCanvas
            blocks={state.blocks}
            selectedBlockId={state.selectedBlockId}
            onSelectBlock={selectBlock}
            onRemoveBlock={removeBlock}
            onReorderBlocks={reorderBlocks}
          />
        </main>
        <aside className={styles.properties}>
          <BlockPropertyEditor
            block={selectedBlock}
            onUpdatePayload={(payload) => {
              if (selectedBlock) updateBlockPayload(selectedBlock.id, payload);
            }}
          />
        </aside>
        <div className={styles.publishBar}>
          <PublishBar status={state.publishStatus} onStatusChange={setPublishStatus} />
        </div>
      </div>
    </div>
  );
}
