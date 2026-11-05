import {
  type DeliveryMode,
  RATE_BASES,
  type RateCardInput,
  rateFor,
  type SelectableRateBasis,
} from '@/lib/rate-card';
import { type ServiceKey, servicesFor } from './class-form-shared';

export type InstructorDeliveryRate = {
  delivery: DeliveryMode;
  service: ServiceKey;
  basis: SelectableRateBasis;
  amount: number;
  title: string;
};

/** Only live, approved rate-card cells can become instructor class services. */
export function instructorDeliveryRates(card?: RateCardInput | null): InstructorDeliveryRate[] {
  const deliveries: DeliveryMode[] = ['IN_PERSON', 'ONLINE', 'HYBRID'];
  return deliveries.flatMap(delivery =>
    servicesFor(delivery).flatMap(service =>
      RATE_BASES.flatMap(basis => {
        const amount = rateFor(card, { format: service.format, delivery, basis: basis.value });
        if (amount === null) return [];
        return [
          {
            delivery,
            service: service.key,
            basis: basis.value,
            amount,
            title:
              delivery === 'HYBRID'
                ? service.format === 'INDIVIDUAL'
                  ? 'Private hybrid session'
                  : 'Group hybrid session'
                : service.title,
          },
        ];
      })
    )
  );
}
