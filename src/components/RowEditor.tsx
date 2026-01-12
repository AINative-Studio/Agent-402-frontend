import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import type { TableSchema, FieldDefinition, FieldValue } from '../lib/types';

interface RowEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, FieldValue>) => void;
    schema: TableSchema;
    initialData?: Record<string, FieldValue>;
    mode: 'create' | 'edit';
    isLoading?: boolean;
}

interface FieldError {
    field: string;
    message: string;
}

export function RowEditor({
    isOpen,
    onClose,
    onSubmit,
    schema,
    initialData = {},
    mode,
    isLoading = false,
}: RowEditorProps) {
    const [formData, setFormData] = useState<Record<string, FieldValue>>(initialData);
    const [errors, setErrors] = useState<FieldError[]>([]);
    const [touched, setTouched] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
            setErrors([]);
            setTouched(new Set());
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const validateField = (fieldName: string, value: FieldValue, fieldDef: FieldDefinition): string | null => {
        // Check required fields
        if (fieldDef.required && (value === undefined || value === null || value === '')) {
            return `${fieldName} is required`;
        }

        // Skip type validation if field is not required and empty
        if (!fieldDef.required && (value === undefined || value === null || value === '')) {
            return null;
        }

        // Type validation
        switch (fieldDef.type) {
            case 'string':
                if (typeof value !== 'string') {
                    return `${fieldName} must be a string`;
                }
                break;
            case 'integer':
            case 'float':
                if (typeof value === 'string') {
                    const num = fieldDef.type === 'integer' ? parseInt(value, 10) : parseFloat(value);
                    if (isNaN(num)) {
                        return `${fieldName} must be a valid number`;
                    }
                } else if (typeof value !== 'number') {
                    return `${fieldName} must be a number`;
                }
                if (fieldDef.type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
                    return `${fieldName} must be an integer`;
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                    return `${fieldName} must be a boolean`;
                }
                break;
            case 'json':
                if (typeof value === 'string') {
                    try {
                        JSON.parse(value);
                    } catch {
                        return `${fieldName} must be valid JSON`;
                    }
                } else if (typeof value !== 'object') {
                    return `${fieldName} must be a valid JSON object`;
                }
                break;
            case 'timestamp':
                if (typeof value === 'string') {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        return `${fieldName} must be a valid timestamp`;
                    }
                }
                break;
        }

        return null;
    };

    const validateForm = (): boolean => {
        const newErrors: FieldError[] = [];
        const fields = schema.fields || {};

        Object.entries(fields).forEach(([fieldName, fieldDef]) => {
            const value = formData[fieldName];
            const error = validateField(fieldName, value, fieldDef);
            if (error) {
                newErrors.push({ field: fieldName, message: error });
            }
        });

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Convert values to proper types
        const processedData: Record<string, FieldValue> = {};
        const fields = schema.fields || {};

        Object.entries(fields).forEach(([fieldName, fieldDef]) => {
            const value = formData[fieldName];

            // Skip undefined/null values for non-required fields
            if (!fieldDef.required && (value === undefined || value === null || value === '')) {
                if (fieldDef.default !== undefined) {
                    processedData[fieldName] = fieldDef.default as FieldValue;
                }
                return;
            }

            // Convert based on type
            switch (fieldDef.type) {
                case 'integer':
                    processedData[fieldName] = typeof value === 'string' ? parseInt(value, 10) : value;
                    break;
                case 'float':
                    processedData[fieldName] = typeof value === 'string' ? parseFloat(value) : value;
                    break;
                case 'boolean':
                    processedData[fieldName] = value === true || value === 'true';
                    break;
                case 'json':
                    processedData[fieldName] = typeof value === 'string' ? JSON.parse(value) : value;
                    break;
                default:
                    processedData[fieldName] = value;
            }
        });

        onSubmit(processedData);
    };

    const handleFieldChange = (fieldName: string, value: FieldValue) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        setTouched(prev => new Set(prev).add(fieldName));

        // Clear error for this field
        setErrors(prev => prev.filter(err => err.field !== fieldName));
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const getFieldError = (fieldName: string): string | undefined => {
        return errors.find(err => err.field === fieldName)?.message;
    };

    const renderFieldInput = (fieldName: string, fieldDef: FieldDefinition) => {
        const value = formData[fieldName];
        const error = getFieldError(fieldName);
        const showError = touched.has(fieldName) && error;

        const baseInputClass = `w-full px-4 py-2 bg-[var(--surface-2)] border rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
            showError ? 'border-red-500' : 'border-[var(--border)]'
        }`;

        switch (fieldDef.type) {
            case 'boolean':
                return (
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={value === true || value === 'true'}
                                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                                disabled={isLoading}
                                className="rounded text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                            />
                            <span className="text-sm text-[var(--text)]">
                                {value === true || value === 'true' ? 'True' : 'False'}
                            </span>
                        </label>
                    </div>
                );

            case 'integer':
            case 'float':
                return (
                    <input
                        type="number"
                        value={value?.toString() || ''}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        step={fieldDef.type === 'float' ? 'any' : '1'}
                        disabled={isLoading}
                        className={baseInputClass}
                        placeholder={`Enter ${fieldDef.type}`}
                    />
                );

            case 'json':
                return (
                    <textarea
                        value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        disabled={isLoading}
                        rows={4}
                        className={`${baseInputClass} font-mono text-sm`}
                        placeholder='{"key": "value"}'
                    />
                );

            case 'timestamp':
                return (
                    <input
                        type="datetime-local"
                        value={value ? new Date(value as string).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        disabled={isLoading}
                        className={baseInputClass}
                    />
                );

            case 'string':
            default:
                return (
                    <input
                        type="text"
                        value={value?.toString() || ''}
                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        disabled={isLoading}
                        className={baseInputClass}
                        placeholder={`Enter ${fieldName}`}
                    />
                );
        }
    };

    const fields = schema.fields || {};
    const fieldEntries = Object.entries(fields);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[var(--border)]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--text)]">
                        {mode === 'create' ? 'Create Row' : 'Edit Row'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-4">
                        {fieldEntries.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                <div className="text-sm text-yellow-300">
                                    No schema defined for this table. Please define a schema first.
                                </div>
                            </div>
                        ) : (
                            fieldEntries.map(([fieldName, fieldDef]) => {
                                const error = getFieldError(fieldName);
                                const showError = touched.has(fieldName) && error;

                                return (
                                    <div key={fieldName}>
                                        <label className="block text-sm font-medium text-[var(--text)] mb-2">
                                            {fieldName}
                                            {fieldDef.required && (
                                                <span className="text-red-400 ml-1">*</span>
                                            )}
                                            <span className="ml-2 text-xs text-[var(--muted)]">
                                                ({fieldDef.type})
                                            </span>
                                        </label>
                                        {renderFieldInput(fieldName, fieldDef)}
                                        {showError && (
                                            <p className="text-sm text-red-400 mt-1">{error}</p>
                                        )}
                                        {fieldDef.default !== undefined && !fieldDef.required && (
                                            <p className="text-xs text-[var(--muted)] mt-1">
                                                Default: {JSON.stringify(fieldDef.default)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {errors.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-300 mb-1">
                                        Please fix the following errors:
                                    </p>
                                    <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                                        {errors.map((err, idx) => (
                                            <li key={idx}>{err.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
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
                            disabled={isLoading || fieldEntries.length === 0}
                            className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {mode === 'create' ? 'Create Row' : 'Save Changes'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
