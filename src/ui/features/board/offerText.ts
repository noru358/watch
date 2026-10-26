import { CONTRACTS } from '../../../data/contracts.data';
import { NODES } from '../../../data/nodes.data';
import { REQUESTS } from '../../../data/requests.data';
import { t, type TKey } from '../../../i18n';
import type { ContractOffer } from '../../../systems/office';

const KIND: Record<ContractOffer['kind'], TKey> = { story: 'board.kind.story', general: 'board.kind.general', bounty: 'board.kind.bounty' };

export const kindLabel = (o: ContractOffer) => t(KIND[o.kind]);

// Who asks and what they saw.
export function offerTitle(o: ContractOffer): string {
  if (o.story) return t(CONTRACTS[o.story].nameKey);
  if (o.request) return t(REQUESTS[o.request].clientKey);
  return t('bounty.client');
}

export function offerBody(o: ContractOffer): string {
  if (o.story) return t(CONTRACTS[o.story].textKey);
  if (o.request) return t(REQUESTS[o.request].textKey);
  const ghost = o.target ? t(`enemy.${o.target}` as TKey) : '';
  return t('bounty.text', { node: t(NODES[o.node].nameKey), ghost });
}
