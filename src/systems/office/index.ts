// Public API of the office module: the day loop, rent, contract board and operations map (pure).
export { advanceDay, refillBoard, resolveNight, startingContamination, morningSeed } from './board';
export { offerFloors, bundleWith, offerFee, offerDifficulty, offerGoal, goalFloorFor, type GoalKind } from './contracts';
export type { ContractOffer, Contamination, OfficeState, MorningReport, NightResolution, WantedTarget, OfferTarget, ChapterState } from './types';
export { chapterStatus, activeChapter, startChapters, type ChapterStatus } from './chapters';
