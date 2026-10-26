// Public API of the office module: the day loop, rent, contract board and operations map (pure).
export { advanceDay, refillBoard, resolveNight, startingContamination, morningSeed } from './board';
export { offerFloors, bundleWith, generalFee, generalFloors } from './contracts';
export type { ContractOffer, Contamination, OfficeState, MorningReport, NightResolution } from './types';
