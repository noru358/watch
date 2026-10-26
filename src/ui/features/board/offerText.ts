import { CONTRACTS } from '../../../data/contracts.data';
import { REQUESTS } from '../../../data/requests.data';
import { t } from '../../../i18n';
import type { ContractOffer } from '../../../systems/office';

// Who asks and what they saw.
export function offerTitle(o: ContractOffer): string {
  if (o.story) return t(CONTRACTS[o.story].nameKey);
  if (o.request) return t(REQUESTS[o.request].clientKey);
  return '';
}

export function offerBody(o: ContractOffer): string {
  if (o.story) return t(CONTRACTS[o.story].textKey);
  if (o.request) return t(REQUESTS[o.request].textKey);
  return '';
}

export { targetName } from '../../../app/names';
