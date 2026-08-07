/**
 * components/SectionLabel.tsx: small uppercase label above a group of rows.
 */

import { AppText } from './AppText';

export function SectionLabel({ children }: { children: string }) {
  return (
    <AppText className="pb-2 pl-0.5 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted">
      {children}
    </AppText>
  );
}
