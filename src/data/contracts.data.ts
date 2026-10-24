import type { ContractId, GhostId, RoomKind } from '../types/ids';

export interface WaveSpawn {
  ghost: GhostId;
  count: number;
}
export type Wave = readonly WaveSpawn[];

export interface ContractData {
  // Room layout: 'combat' rooms draw their waves from the pool for their tier.
  layout: readonly RoomKind[];
  wavePools: readonly (readonly (readonly Wave[])[])[]; // [tier][option][wave]
  combatTierByIndex: readonly number[]; // tier for the n-th combat room
  fee: number; // paid on boss kill
}

export const ROOM_SIZE = { width: 960, height: 540, wall: 24, doorWidth: 90 } as const;

export const CONTRACTS: Record<ContractId, ContractData> = {
  euljiro_printer: {
    layout: ['combat', 'combat', 'combat', 'payphone', 'combat', 'combat', 'boss'],
    combatTierByIndex: [0, 0, 1, 1, 2],
    fee: 300,
    wavePools: [
      // tier 0
      [
        [[{ ghost: 'cheonyeo', count: 3 }], [{ ghost: 'cheonyeo', count: 2 }, { ghost: 'dalgyal', count: 1 }]],
        [[{ ghost: 'subway', count: 2 }], [{ ghost: 'cheonyeo', count: 3 }]],
      ],
      // tier 1
      [
        [[{ ghost: 'cheonyeo', count: 3 }, { ghost: 'subway', count: 1 }], [{ ghost: 'dalgyal', count: 2 }, { ghost: 'subway', count: 2 }]],
        [[{ ghost: 'dalgyal', count: 2 }, { ghost: 'cheonyeo', count: 2 }], [{ ghost: 'subway', count: 3 }]],
      ],
      // tier 2
      [
        [
          [{ ghost: 'subway', count: 3 }, { ghost: 'cheonyeo', count: 2 }],
          [{ ghost: 'dalgyal', count: 2 }, { ghost: 'cheonyeo', count: 3 }],
          [{ ghost: 'subway', count: 2 }, { ghost: 'dalgyal', count: 2 }],
        ],
      ],
    ],
  },
};
