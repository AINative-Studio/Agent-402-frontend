import type { TableSchema } from '../lib/types';

interface SchemaViewerProps {
  schema: TableSchema;
}

const typeColors: Record<string, string> = {
  string: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  number: 'bg-green-500/20 text-green-300 border-green-500/30',
  boolean: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  object: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  array: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  date: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export function SchemaViewer({ schema }: SchemaViewerProps) {
  const fields = schema?.fields || {};
  const indexes = schema?.indexes || [];
  const fieldEntries = Object.entries(fields);

  if (fieldEntries.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Schema</h3>
        <p className="text-gray-400 text-sm">No schema defined. This is a schemaless NoSQL table.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Schema</h3>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Fields</h4>
          <div className="space-y-2">
            {fieldEntries.map(([fieldName, fieldDef]) => {
              const type = typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
              const required = typeof fieldDef === 'object' && fieldDef.required;
              const hasDefault = typeof fieldDef === 'object' && 'default' in fieldDef;

              return (
                <div
                  key={fieldName}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <code className="text-white font-mono text-sm">{fieldName}</code>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${
                        typeColors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}
                    >
                      {type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {required && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30">
                        required
                      </span>
                    )}
                    {hasDefault && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30">
                        default
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {indexes.length > 0 && (
          <div className="pt-3 border-t border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Indexes</h4>
            <div className="space-y-2">
              {indexes.map((index: string | string[] | { fields: string[]; unique?: boolean }, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-white font-mono text-sm">
                      {Array.isArray(index)
                        ? index.join(', ')
                        : typeof index === 'object' && 'fields' in index
                        ? (index as { fields: string[] }).fields.join(', ')
                        : String(index)}
                    </code>
                  </div>
                  {typeof index === 'object' && 'unique' in index && (index as { unique?: boolean }).unique && (
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded border border-indigo-500/30">
                      unique
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
