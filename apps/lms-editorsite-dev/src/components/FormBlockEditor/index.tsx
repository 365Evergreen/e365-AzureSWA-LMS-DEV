import { useState } from 'react';
import type { FormPayload, FormField, FormFieldType } from '@lms/block-registry';
import styles from './FormBlockEditor.module.css';

interface Props {
  payload: FormPayload;
  onChange: (payload: FormPayload) => void;
}

export default function FormBlockEditor({ payload, onChange }: Props) {
  function update(partial: Partial<FormPayload>) {
    onChange({ ...payload, ...partial });
  }

  function updateField(id: string, partial: Partial<FormField>) {
    onChange({
      ...payload,
      fields: payload.fields.map((f) => (f.id === id ? { ...f, ...partial } : f)),
    });
  }

  function addField() {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: 'text',
      label: 'New field',
      placeholder: '',
      required: false,
      options: [],
      fullWidth: false,
    };
    onChange({ ...payload, fields: [...payload.fields, newField] });
  }

  function removeField(id: string) {
    onChange({ ...payload, fields: payload.fields.filter((f) => f.id !== id) });
  }

  function moveField(id: string, dir: 'up' | 'down') {
    const idx = payload.fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= payload.fields.length) return;
    const fields = [...payload.fields];
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    onChange({ ...payload, fields });
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <label className={styles.label} htmlFor="form-title">Form title</label>
        <input
          id="form-title"
          className={styles.input}
          value={payload.title ?? ''}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Optional title shown above the form"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Layout</label>
        <div className={styles.segmented}>
          <button
            className={payload.layout !== '2col' ? styles.segmentActive : styles.segment}
            onClick={() => update({ layout: '1col' })}
            type="button"
          >
            1 column
          </button>
          <button
            className={payload.layout === '2col' ? styles.segmentActive : styles.segment}
            onClick={() => update({ layout: '2col' })}
            type="button"
          >
            2 columns
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Label position</label>
        <div className={styles.segmented}>
          <button
            className={payload.labelPosition !== 'inline' ? styles.segmentActive : styles.segment}
            onClick={() => update({ labelPosition: 'above' })}
            type="button"
          >
            Above
          </button>
          <button
            className={payload.labelPosition === 'inline' ? styles.segmentActive : styles.segment}
            onClick={() => update({ labelPosition: 'inline' })}
            type="button"
          >
            Inline
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="form-submit-label">Submit button label</label>
        <input
          id="form-submit-label"
          className={styles.input}
          value={payload.submitLabel ?? 'Submit'}
          onChange={(e) => update({ submitLabel: e.target.value })}
        />
      </div>

      <div className={styles.fieldsHeader}>
        <span className={styles.label} style={{ margin: 0 }}>Fields ({payload.fields.length})</span>
        <button className={styles.addBtn} onClick={addField} type="button">
          + Add field
        </button>
      </div>

      <div className={styles.fields}>
        {payload.fields.length === 0 && (
          <p className={styles.emptyHint}>No fields yet. Click "Add field" to get started.</p>
        )}
        {payload.fields.map((field, idx) => (
          <FieldEditor
            key={field.id}
            field={field}
            isFirst={idx === 0}
            isLast={idx === payload.fields.length - 1}
            showFullWidth={payload.layout === '2col'}
            onUpdate={(partial) => updateField(field.id, partial)}
            onRemove={() => removeField(field.id)}
            onMove={(dir) => moveField(field.id, dir)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── FieldEditor ──────────────────────────────────────────────────────────────

interface FieldEditorProps {
  field: FormField;
  isFirst: boolean;
  isLast: boolean;
  showFullWidth: boolean;
  onUpdate: (partial: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function FieldEditor({ field, isFirst, isLast, showFullWidth, onUpdate, onRemove, onMove }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.fieldCard}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldHeaderLeft}>
          <button
            className={styles.iconBtn}
            onClick={() => onMove('up')}
            disabled={isFirst}
            type="button"
            title="Move up"
          >↑</button>
          <button
            className={styles.iconBtn}
            onClick={() => onMove('down')}
            disabled={isLast}
            type="button"
            title="Move down"
          >↓</button>
          <span className={styles.fieldTypeTag}>{field.type}</span>
          <span className={styles.fieldLabelText}>{field.label || '(unlabeled)'}</span>
          {field.required && <span className={styles.requiredBadge}>required</span>}
        </div>
        <div className={styles.fieldHeaderRight}>
          <button
            className={styles.iconBtn}
            onClick={() => setExpanded((e) => !e)}
            type="button"
            title={expanded ? 'Collapse' : 'Edit'}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={onRemove}
            type="button"
            title="Remove field"
          >
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.fieldBody}>
          <label className={styles.label}>Type</label>
          <select
            className={styles.select}
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value as FormFieldType })}
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="number">Number</option>
            <option value="textarea">Text area</option>
            <option value="select">Select (dropdown)</option>
          </select>

          <label className={styles.label}>Label</label>
          <input
            className={styles.input}
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
          />

          <label className={styles.label}>Placeholder / hint text</label>
          <input
            className={styles.input}
            value={field.placeholder ?? ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Optional hint shown inside the field"
          />

          <div className={styles.checkRow}>
            <input
              type="checkbox"
              id={`req-${field.id}`}
              checked={field.required ?? false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
            />
            <label htmlFor={`req-${field.id}`}>Required</label>
          </div>

          {showFullWidth && (
            <div className={styles.checkRow}>
              <input
                type="checkbox"
                id={`fw-${field.id}`}
                checked={field.fullWidth ?? false}
                onChange={(e) => onUpdate({ fullWidth: e.target.checked })}
              />
              <label htmlFor={`fw-${field.id}`}>Full width (spans both columns)</label>
            </div>
          )}

          {field.type === 'select' && (
            <OptionsEditor
              options={field.options ?? []}
              onChange={(options) => onUpdate({ options })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── OptionsEditor ────────────────────────────────────────────────────────────

function OptionsEditor({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) {
  function addOption() {
    onChange([...options, '']);
  }
  function updateOption(idx: number, val: string) {
    const next = [...options];
    next[idx] = val;
    onChange(next);
  }
  function removeOption(idx: number) {
    onChange(options.filter((_, i) => i !== idx));
  }

  return (
    <div className={styles.optionsSection}>
      <label className={styles.label}>Options</label>
      {options.length === 0 && (
        <p className={styles.emptyHint} style={{ marginBottom: '0.5rem' }}>No options yet.</p>
      )}
      {options.map((opt, idx) => (
        <div key={idx} className={styles.optionRow}>
          <input
            className={styles.input}
            value={opt}
            onChange={(e) => updateOption(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            style={{ flex: 1 }}
          />
          <button className={styles.iconBtnDanger} onClick={() => removeOption(idx)} type="button" title="Remove option">
            ✕
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={addOption} type="button">
        + Add option
      </button>
    </div>
  );
}
