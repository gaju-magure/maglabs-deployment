import React from 'react';
import { DataTable } from './DataTable';
import { TablePresetConfig } from './presets';

interface PresetDataTableProps<T> {
  preset: TablePresetConfig<T>;
  data: T[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onCreateNew?: () => void;
  canCreate?: boolean;
  getItemKey: (item: T) => string | number;
  actionHandlers: {
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onSendInvitation?: (item: T) => void;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  className?: string;
  // Override any preset values if needed
  titleOverride?: string;
  descriptionOverride?: string;
}

export function PresetDataTable<T>({
  preset,
  data,
  loading = false,
  searchQuery = '',
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  onCreateNew,
  canCreate = false,
  getItemKey,
  actionHandlers,
  className = '',
  titleOverride,
  descriptionOverride,
}: PresetDataTableProps<T>) {
  const actions = preset.createActions(actionHandlers);

  return (
    <DataTable
      title={titleOverride || preset.title}
      description={descriptionOverride || preset.description}
      data={data}
      columns={preset.columns}
      actions={actions}
      loading={loading}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={preset.searchPlaceholder}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      onCreateNew={onCreateNew}
      createButtonLabel={preset.createButtonLabel}
      canCreate={canCreate}
      emptyStateTitle={preset.emptyStateTitle}
      emptyStateDescription={preset.emptyStateDescription}
      emptyStateIcon={preset.emptyStateIcon}
      getItemKey={getItemKey}
      className={className}
    />
  );
}