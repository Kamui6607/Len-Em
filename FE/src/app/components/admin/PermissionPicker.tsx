// ============================================================
// PermissionPicker — reusable multi-select checkbox component
// Groups permissions by resource, with select-all per group
// ============================================================

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { Permission } from "../../../api/permissionService";

interface PermissionPickerProps {
  permissions: Permission[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

/**
 * Groups permissions by resource and renders a checkbox list.
 * Each resource group has a "select all" toggle.
 */
export function PermissionPicker({
  permissions,
  selected,
  onChange,
  disabled = false,
}: PermissionPickerProps) {
  // Group permissions by resource
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const perm of permissions) {
      const group = map.get(perm.resource) ?? [];
      group.push(perm);
      map.set(perm.resource, group);
    }
    // Sort groups alphabetically
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  // Check if all permissions in a group are selected
  const isGroupAllSelected = (groupPerms: Permission[]) =>
    groupPerms.every((p) => selected.includes(p._id));

  // Check if some (but not all) permissions in a group are selected
  const isGroupPartiallySelected = (groupPerms: Permission[]) =>
    groupPerms.some((p) => selected.includes(p._id)) &&
    !isGroupAllSelected(groupPerms);

  // Toggle a single permission
  const togglePermission = (permId: string) => {
    if (disabled) return;
    const next = selected.includes(permId)
      ? selected.filter((id) => id !== permId)
      : [...selected, permId];
    onChange(next);
  };

  // Toggle all permissions in a group
  const toggleGroup = (groupPerms: Permission[]) => {
    if (disabled) return;
    const allSelected = isGroupAllSelected(groupPerms);
    if (allSelected) {
      // Deselect all in group
      const groupIds = new Set(groupPerms.map((p) => p._id));
      onChange(selected.filter((id) => !groupIds.has(id)));
    } else {
      // Select all in group
      const groupIds = groupPerms.map((p) => p._id);
      const existing = new Set(selected);
      const toAdd = groupIds.filter((id) => !existing.has(id));
      onChange([...selected, ...toAdd]);
    }
  };

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground">No permissions available</p>
      )}
      {grouped.map(([resource, groupPerms]) => (
        <div key={resource} className="border border-border rounded-xl overflow-hidden">
          {/* Group header */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggleGroup(groupPerms)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 bg-muted/40 text-sm font-semibold capitalize transition-colors ${
              disabled ? "cursor-default" : "hover:bg-muted/60 cursor-pointer"
            }`}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isGroupAllSelected(groupPerms)
                  ? "bg-primary border-primary"
                  : isGroupPartiallySelected(groupPerms)
                    ? "bg-primary/40 border-primary"
                    : "border-border"
              }`}
            >
              {(isGroupAllSelected(groupPerms) || isGroupPartiallySelected(groupPerms)) && (
                <Check size={12} className="text-primary-foreground" />
              )}
            </div>
            <span>{resource}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {groupPerms.filter((p) => selected.includes(p._id)).length}/{groupPerms.length}
            </span>
          </button>

          {/* Permission items */}
          <div className="divide-y divide-border">
            {groupPerms.map((perm) => {
              const isSelected = selected.includes(perm._id);
              return (
                <label
                  key={perm._id}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    disabled
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => togglePermission(perm._id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-primary-foreground" />}
                  </div>
                  <span className="font-medium text-sm capitalize">{perm.action}</span>
                  {perm.description && (
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
                      {perm.description}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}