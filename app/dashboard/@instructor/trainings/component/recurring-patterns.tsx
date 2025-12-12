export function RecurrencePatternCell({ recurrenceUuid }: { recurrenceUuid?: string }) {
  if (!recurrenceUuid) {
    return <span className='text-muted-foreground'>Not set</span>;
  }

  return <span className='text-foreground'>{recurrenceUuid}</span>;
}

export function RecurrenceDaysCell({ recurrenceUuid }: { recurrenceUuid?: string }) {
  if (!recurrenceUuid) {
    return <span className='text-muted-foreground'>Not set</span>;
  }

  return <span className='text-foreground'>{recurrenceUuid}</span>;
}
