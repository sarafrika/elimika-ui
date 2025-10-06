const RecurringDisplay = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className='bg-muted/30 text-muted-foreground space-y-2 rounded-md border p-3.5 text-sm'>
      {data.days_of_week && (
        <div>
          <span className='text-foreground font-medium'>Day(s) of week:</span> {data.days_of_week}
        </div>
      )}

      {data.day_of_month && (
        <div>
          <span className='text-foreground font-medium'>Day of month:</span> {data.day_of_month}
        </div>
      )}

      {data.end_date && (
        <div>
          <span className='text-foreground font-medium'>Ends on:</span>{' '}
          {new Date(data.end_date).toLocaleDateString()}
        </div>
      )}

      {data.occurrence_count && (
        <div>
          <span className='text-foreground font-medium'>Occurrences:</span> {data.occurrence_count}
        </div>
      )}

      <div>
        <span className='text-foreground font-medium'>Status:</span>{' '}
        {data.is_active ? 'Active' : 'Inactive'}
      </div>

      {data.pattern_description && (
        <div className='text-foreground pt-2 italic'>{data.pattern_description}</div>
      )}
    </div>
  );
};

export default RecurringDisplay;
