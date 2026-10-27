import { FACILITIES, FACILITY_IDS } from '../../data/facilities.data';
import { MODIFIERS } from '../../data/modifiers.data';
import { NODES } from '../../data/nodes.data';
import { GENERAL_OBJECTIVES } from '../../data/objectives.data';
import { TRAINING } from '../../data/training.data';
import { t } from '../../i18n';
import { trainingCap } from '../../systems/reputation';
import type { NodeId, TrainingId } from '../../types/ids';

// The things a 평판 rank opens, in words, read straight from the data rows' `rank` fields.
export function rankUnlocks(rank: number): string[] {
  const out: string[] = [];
  for (const [id, rule] of Object.entries(GENERAL_OBJECTIVES)) if (rule.rank === rank) out.push(t('unlock.objective', { name: t(`board.goal.${id}` as Parameters<typeof t>[0]) }));
  for (const id of Object.keys(NODES) as NodeId[]) if (NODES[id].rank === rank) out.push(t('unlock.node', { name: t(NODES[id].nameKey) }));
  const mods = Object.values(MODIFIERS).filter((m) => m.rank === rank).length;
  if (mods > 0) out.push(t('unlock.mods', { count: mods }));
  for (const id of FACILITY_IDS) FACILITIES[id].ranks.forEach((r, lv) => r === rank && rank > 0 && out.push(t('unlock.facility', { name: t(FACILITIES[id].nameKey), level: lv + 1 })));
  if ((Object.keys(TRAINING) as TrainingId[]).some((id) => trainingCap(rank, id) > trainingCap(rank - 1, id))) out.push(t('unlock.training'));
  return out;
}
