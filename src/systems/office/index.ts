// Public API of the office module: the day loop, rent, contract board and operations map (pure).
export { advanceDay, refillBoard, resolveNight, startingContamination, morningSeed } from './board';
export { offerFloors, bundleWith, generalFee, generalFloors, offerDifficulty, offerGoal, type GoalKind } from './contracts';
export type { ContractOffer, Contamination, OfficeState, MorningReport, NightResolution, WantedTarget } from './types';
