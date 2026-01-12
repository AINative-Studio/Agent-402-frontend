import { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import type { TableSchema, FieldDefinition, FieldType } from '../lib/types';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { table_name: string; description?: string; schema: TableSchema }) => void;
  isLoading?: boolean;
}

interface Field {
  name: string;
  type: FieldType;
  required: boolean;
}

export function CreateTableModal({ isOpen, onClose, onSubmit, isLoading = false }: CreateTableModalProps) {
  const [tableName, setTableName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([{ name: '', type: 'string', required: false }]);
  const [indexes, setIndexes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate table name
    if (!tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
      newErrors.tableName = 'Table name must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    // Validate fields
    const fieldNames = new Set<string>();
    fields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field-${index}-name`] = 'Field name is required';
      } else if (!/^[a-z][a-z0-9_]*$/.test(field.name)) {
        newErrors[`field-${index}-name`] = 'Field name must start with a letter and contain only lowercase letters, numbers, and underscores';
      } else if (fieldNames.has(field.name)) {
        newErrors[`field-${index}-name`] = 'Duplicate field name';
      }
      fieldNames.add(field.name);
    });

    if (fields.length === 0 || fields.every(f => !f.name.trim())) {
      newErrors.fields = 'At least one field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Build schema
    const schema: TableSchema = {
      fields: {},
    };

    // Add fields
    fields.forEach(field => {
      if (field.name.trim()) {
        const fieldDef: FieldDefinition = {
          type: field.type,
          required: field.required,
        };
        schema.fields[field.name] = fieldDef;
      }
    });

    // Add indexes
    if (indexes.length > 0) {
      const filteredIndexes = indexes.filter(name => name.trim() !== '');
      if (filteredIndexes.length > 0) {
        schema.indexes = filteredIndexes;
      }
    }

    onSubmit({
      table_name: tableName,
      description: description.trim() || undefined,
      schema,
    });
  };

  const addField = () => {
    setFields([...fields, { name: '', type: 'string' as const, required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    setFields(fields.map((field, i) => (i === index ? { ...field, ...updates } : field)));
  };

  const handleClose = () => {
    if (!isLoading) {
      setTableName('');
      setDescription('');
      setFields([{ name: '', type: 'string' as const, required: false }]);
      setIndexes([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text)]">Create Table</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Table Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Table Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="customers"
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={isLoading}
              />
              {errors.tableName && (
                <p className="text-sm text-red-400 mt-1">{errors.tableName}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Customer information table"
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={isLoading}
              />
            </div>

            {/* Schema Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[var(--text)]">
                  Schema Fields <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={addField}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
              </div>

              {errors.fields && (
                <p className="text-sm text-red-400 mb-2">{errors.fields}</p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="field_name"
                        className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                        disabled={isLoading}
                      />
                      {errors[`field-${index}-name`] && (
                        <p className="text-xs text-red-400 mt-1">{errors[`field-${index}-name`]}</p>
                      )}
                    </div>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as Field['type'] })}
                      className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                      disabled={isLoading}
                    >
                      <option value="string">String</option>
                      <option value="integer">Integer</option>
                      <option value="float">Float</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                      <option value="timestamp">Timestamp</option>
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="rounded text-[var(--primary)]"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-[var(--text)]">Required</span>
                    </label>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        disabled={isLoading}
                        className="p-2 text-[var(--muted)] hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Index Configuration (Optional) */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Index Fields (optional)
              </label>
              <div className="text-xs text-[var(--muted)] mb-2">
                Select fields to create an index for faster queries
              </div>
              <div className="space-y-2">
                {fields.filter(f => f.name.trim()).map((field, index) => (
                  <label key={index} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--surface-2)]/80">
                    <input
                      type="checkbox"
                      checked={indexes.includes(field.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIndexes([...indexes, field.name]);
                        } else {
                          setIndexes(indexes.filter(name => name !== field.name));
                        }
                      }}
                      className="rounded text-[var(--primary)]"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-[var(--text)]">{field.name}</span>
                    <span className="text-xs text-[var(--muted)] ml-auto">{field.type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--surface-2)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !tableName.trim()}
              className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Table'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
