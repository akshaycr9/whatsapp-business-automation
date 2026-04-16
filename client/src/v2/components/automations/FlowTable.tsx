import React from 'react';
import { Pencil } from 'lucide-react';
import { FlowStatusToggle } from './FlowStatusToggle';
import type { V2Flow } from '@/v2/lib/v2-mock-data';

interface FlowTableProps {
  flows: V2Flow[];
  onToggle: (id: string, next: boolean) => void;
  onEdit: (flow: V2Flow) => void;
}

/**
 * Main flow table — Flow Name | Status toggle | Actions (edit).
 * Matches the Stitch desktop table design exactly.
 * Rows separated by bg-stitch-surface-low (no explicit borders — the "No-Line" rule).
 */
export const FlowTable = React.memo(function FlowTable({
  flows,
  onToggle,
  onEdit,
}: FlowTableProps): React.ReactElement {
  if (flows.length === 0) {
    return (
      <div className="bg-stitch-surface-lowest rounded-2xl p-12 text-center">
        <p className="text-stitch-on-surface-variant text-sm">
          No flows configured for this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stitch-surface-lowest rounded-2xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-stitch-surface-low">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
              Flow Name
            </th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stitch-on-surface-variant text-center">
              Status
            </th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stitch-on-surface-variant text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stitch-surface-low">
          {flows.map((flow) => (
            <tr
              key={flow.id}
              className="group hover:bg-stitch-surface-low transition-colors"
            >
              {/* Flow Name */}
              <td className="px-6 py-6">
                <p className="text-sm font-semibold text-stitch-on-surface">{flow.name}</p>
              </td>

              {/* Status Toggle */}
              <td className="px-6 py-6">
                <div className="flex justify-center">
                  <FlowStatusToggle
                    checked={flow.active}
                    onToggle={(next) => onToggle(flow.id, next)}
                  />
                </div>
              </td>

              {/* Edit Action */}
              <td className="px-6 py-6 text-right">
                <button
                  onClick={() => onEdit(flow)}
                  className="p-2 text-slate-400 hover:text-stitch-on-surface transition-colors rounded-lg hover:bg-stitch-surface-high"
                  aria-label={`Edit ${flow.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
