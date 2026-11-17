// Public API of the office module: the day loop, rent, contract board and operations map (pure).
export { advanceDay, refillBoard, resolveNight, morningSeed, openNodes, postEnvelope, type NightOutcome } from './board';
export { offerFloors, offerLength, planNight, canJoin, joinCandidates, jointLead, offerFee, offerDifficulty, offerGoal, offerHeat, nightDifficulty, type OfferHeat, goalFloorFor, type GoalKind, type NightGoal, type NightPlanned } from './contracts';
export type { ContractOffer, OfficeState, MorningReport, NightResolution, WantedTarget, OfferTarget, ChapterState } from './types';
export { chapterStatus, activeChapter, startChapters, type ChapterStatus } from './chapters';
export { freshLoan, loanAct, minPaymentDue, reclaimPrice, settleLoan, resolveEnvelope, type LoanState, type LoanWeek, type Seizable, type EnvelopeState } from './loan';
