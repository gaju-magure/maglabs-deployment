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

// Vibrant sticky-note background colors for cards
export const IdeaStickyNoteColors: Record<IdeaStatus, string> = {
  [IdeaStatus.Submitted]: 'bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 text-blue-900 border-blue-300',
  [IdeaStatus.UnderReview]: 'bg-gradient-to-br from-yellow-200 via-yellow-300 to-amber-400 text-yellow-900 border-yellow-400',
  [IdeaStatus.Refined]: 'bg-gradient-to-br from-indigo-200 via-indigo-300 to-purple-400 text-indigo-900 border-indigo-400',
  [IdeaStatus.InDevelopment]: 'bg-gradient-to-br from-purple-200 via-purple-300 to-violet-400 text-purple-900 border-purple-400',
  [IdeaStatus.Testing]: 'bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400 text-orange-900 border-orange-400',
  [IdeaStatus.Implemented]: 'bg-gradient-to-br from-green-200 via-green-300 to-emerald-400 text-green-900 border-green-400',
  [IdeaStatus.Rejected]: 'bg-gradient-to-br from-red-200 via-red-300 to-red-400 text-red-900 border-red-400',
  [IdeaStatus.OnHold]: 'bg-gradient-to-br from-gray-200 via-gray-300 to-slate-400 text-gray-900 border-gray-400',
  [IdeaStatus.NeedsClarification]: 'bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-400 text-amber-900 border-amber-400',
  [IdeaStatus.Approved]: 'bg-gradient-to-br from-emerald-200 via-emerald-300 to-green-400 text-emerald-900 border-emerald-400',
  [IdeaStatus.Archived]: 'bg-gradient-to-br from-slate-200 via-slate-300 to-gray-400 text-slate-900 border-slate-400',
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
