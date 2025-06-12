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

// Status color mappings for UI components (badges)
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

// White sticky-note background colors with black text and colored borders
export const IdeaStickyNoteColors: Record<IdeaStatus, string> = {
  [IdeaStatus.Submitted]: 'bg-white text-gray-900 border-blue-300 shadow-blue-100/50',
  [IdeaStatus.UnderReview]: 'bg-white text-gray-900 border-yellow-300 shadow-yellow-100/50',
  [IdeaStatus.Refined]: 'bg-white text-gray-900 border-indigo-300 shadow-indigo-100/50',
  [IdeaStatus.InDevelopment]: 'bg-white text-gray-900 border-purple-300 shadow-purple-100/50',
  [IdeaStatus.Testing]: 'bg-white text-gray-900 border-orange-300 shadow-orange-100/50',
  [IdeaStatus.Implemented]: 'bg-white text-gray-900 border-green-300 shadow-green-100/50',
  [IdeaStatus.Rejected]: 'bg-white text-gray-900 border-red-300 shadow-red-100/50',
  [IdeaStatus.OnHold]: 'bg-white text-gray-900 border-gray-300 shadow-gray-100/50',
  [IdeaStatus.NeedsClarification]: 'bg-white text-gray-900 border-amber-300 shadow-amber-100/50',
  [IdeaStatus.Approved]: 'bg-white text-gray-900 border-emerald-300 shadow-emerald-100/50',
  [IdeaStatus.Archived]: 'bg-white text-gray-900 border-slate-300 shadow-slate-100/50',
};

// Rotation angles for sticky-note effect (in degrees)
export const IdeaStickyNoteRotations: string[] = [
  'rotate-[-2deg]',
  'rotate-[-1deg]',
  'rotate-[0deg]',
  'rotate-[1deg]',
  'rotate-[2deg]',
];

// Shadow effects for sticky-note depth
export const IdeaStickyNoteShadows: Record<string, string> = {
  default: 'shadow-lg shadow-black/20',
  hover: 'shadow-xl shadow-black/30',
  pinned: 'shadow-2xl shadow-amber-500/20',
};

// Priority color mappings for UI components
export const IdeaPriorityColors: Record<IdeaPriority, string> = {
  [IdeaPriority.Low]: 'bg-gray-100 text-gray-800',
  [IdeaPriority.Medium]: 'bg-blue-100 text-blue-800',
  [IdeaPriority.High]: 'bg-orange-100 text-orange-800',
  [IdeaPriority.Critical]: 'bg-red-100 text-red-800',
};
