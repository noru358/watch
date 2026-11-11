import { t, type TKey } from '../../i18n';
import type { Staff, StaffCandidate } from '../../systems/staff';

// "김도윤" from the name tables (staff.family.N + staff.given.N; English puts a space between).
export function staffName(st: Pick<Staff | StaffCandidate, 'name'>): string {
  const family = t(`staff.family.${st.name[0]}` as TKey);
  const given = t(`staff.given.${st.name[1]}` as TKey);
  return /[a-z]/i.test(family) ? `${given} ${family}` : `${family}${given}`;
}
