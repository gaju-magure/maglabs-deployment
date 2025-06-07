export enum IdeaStatus {
  Open = 'open',
  InReview = 'in_review',
  Closed = 'closed',
  Refined = 'refined',
}

export const IdeaStatusLabels: Record<IdeaStatus, string> = {
  [IdeaStatus.Open]: 'Open',
  [IdeaStatus.InReview]: 'In Review',
  [IdeaStatus.Closed]: 'Closed',
  [IdeaStatus.Refined]: 'Refined',
};
