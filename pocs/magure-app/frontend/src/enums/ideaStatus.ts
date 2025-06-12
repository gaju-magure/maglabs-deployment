export enum IdeaStatus {
  Submitted = 'submitted',
  UnderReview = 'under_review',
  InDevelopment = 'in_development',
  Testing = 'testing',
  Implemented = 'implemented',
  Rejected = 'rejected',
  OnHold = 'on_hold',
  NeedsClarification = 'needs_clarification',
  Approved = 'approved',
  Archived = 'archived',
}

export const IdeaStatusLabels: Record<IdeaStatus, string> = {
  [IdeaStatus.Submitted]: 'Submitted',
  [IdeaStatus.UnderReview]: 'Under Review',
  [IdeaStatus.InDevelopment]: 'In Development',
  [IdeaStatus.Testing]: 'Testing',
  [IdeaStatus.Implemented]: 'Implemented',
  [IdeaStatus.Rejected]: 'Rejected',
  [IdeaStatus.OnHold]: 'On Hold',
  [IdeaStatus.NeedsClarification]: 'Needs Clarification',
  [IdeaStatus.Approved]: 'Approved',
  [IdeaStatus.Archived]: 'Archived',
};

export enum IdeaPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export const IdeaPriorityLabels: Record<IdeaPriority, string> = {
  [IdeaPriority.Low]: 'Low',
  [IdeaPriority.Medium]: 'Medium',
  [IdeaPriority.High]: 'High',
  [IdeaPriority.Critical]: 'Critical',
};

// Status color mappings for UI components
export const IdeaStatusColors: Record<IdeaStatus, string> = {
  [IdeaStatus.Submitted]: 'bg-blue-100 text-blue-800',
  [IdeaStatus.UnderReview]: 'bg-yellow-100 text-yellow-800',
  [IdeaStatus.InDevelopment]: 'bg-purple-100 text-purple-800',
  [IdeaStatus.Testing]: 'bg-orange-100 text-orange-800',
  [IdeaStatus.Implemented]: 'bg-green-100 text-green-800',
  [IdeaStatus.Rejected]: 'bg-red-100 text-red-800',
  [IdeaStatus.OnHold]: 'bg-gray-100 text-gray-800',
  [IdeaStatus.NeedsClarification]: 'bg-amber-100 text-amber-800',
  [IdeaStatus.Approved]: 'bg-emerald-100 text-emerald-800',
  [IdeaStatus.Archived]: 'bg-slate-100 text-slate-800',
};

// Priority color mappings for UI components
export const IdeaPriorityColors: Record<IdeaPriority, string> = {
  [IdeaPriority.Low]: 'bg-gray-100 text-gray-800',
  [IdeaPriority.Medium]: 'bg-blue-100 text-blue-800',
  [IdeaPriority.High]: 'bg-orange-100 text-orange-800',
  [IdeaPriority.Critical]: 'bg-red-100 text-red-800',
};
