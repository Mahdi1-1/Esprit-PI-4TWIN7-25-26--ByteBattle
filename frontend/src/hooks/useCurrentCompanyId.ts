import { useEffect, useState } from 'react';
import { companyService } from '../services/companyService';

export function useCurrentCompanyId(routeCompanyId?: string) {
  const [companyId, setCompanyId] = useState<string | null | undefined>(routeCompanyId ?? undefined);

  useEffect(() => {
    if (routeCompanyId) {
      setCompanyId(routeCompanyId);
      return;
    }

    if (companyId === undefined) {
      companyService.getMyCompanyId().then((cid) => {
        setCompanyId(cid);
      });
    }
  }, [routeCompanyId]);

  return companyId;
}
