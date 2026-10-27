// Public API of the office module: the day loop, rent, contract board and operations map (pure).
export { advanceDay, refillBoard, resolveNight, startingContamination, morningSeed, openNodes, overflowTargets, type NightOutcome } from './board';
export { offerFloors, planNight, canJoin, joinCandidates, jointLead, offerFee, offerDifficulty, offerGoal, offerHeat, nightDifficulty, type OfferHeat, goalFloorFor, type GoalKind, type NightGoal, type NightPlanned } from './contracts';
export type { ContractOffer, Contamination, OfficeState, MorningReport, NightResolution, WantedTarget, OfferTarget, ChapterState } from './types';
export { chapterStatus, activeChapter, startChapters, type ChapterStatus } from './chapters';
