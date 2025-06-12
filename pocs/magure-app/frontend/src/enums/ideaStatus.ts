export enum IdeaStatus {
  Submitted = 'submitted',
  UnderReview = 'under_review',
  Refined = 'refined',
  InDevelopment = 'in_development',
  Testing = 'testing',
  Implemented = 'implemented',
  Rejected = 'rejected',
  OnHold = 'on_hold',
  NeedsClarification = 'needs_clarification',
  Approved = 'approved',
  Archived = 'archived',
}

export const IdeaStatusLabels: Record<string, string> = {
  'submitted': 'Submitted',
  'under_review': 'Under Review',
  'refined': 'Refined',
  'in_development': 'In Development',
  'testing': 'Testing',
  'implemented': 'Implemented',
  'rejected': 'Rejected',
  'on_hold': 'On Hold',
  'needs_clarification': 'Needs Clarification',
  'approved': 'Approved',
  'archived': 'Archived',
};

export enum IdeaPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export const IdeaPriorityLabels: Record<string, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
};

// Status color mappings for UI components
export const IdeaStatusColors: Record<IdeaStatus, string> = {
  [IdeaStatus.Submitted]: 'bg-blue-100 text-blue-800',
  [IdeaStatus.UnderReview]: 'bg-yellow-100 text-yellow-800',
  [IdeaStatus.Refined]: 'bg-indigo-100 text-indigo-800',
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
