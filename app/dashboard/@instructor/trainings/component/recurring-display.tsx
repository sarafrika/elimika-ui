
const RecurringDisplay = ({ data }: { data: any }) => {
    if (!data) return null

    return (
        <div className="rounded-md border p-3.5 bg-muted/30 space-y-2 text-sm text-muted-foreground">
            {data.days_of_week && (
                <div>
                    <span className="font-medium text-foreground">Day(s) of week:</span>{' '}
                    {data.days_of_week}
                </div>
            )}

            {data.day_of_month && (
                <div>
                    <span className="font-medium text-foreground">Day of month:</span>{' '}
                    {data.day_of_month}
                </div>
            )}

            {data.end_date && (
                <div>
                    <span className="font-medium text-foreground">Ends on:</span>{' '}
                    {new Date(data.end_date).toLocaleDateString()}
                </div>
            )}

            {data.occurrence_count && (
                <div>
                    <span className="font-medium text-foreground">Occurrences:</span>{' '}
                    {data.occurrence_count}
                </div>
            )}

            <div>
                <span className="font-medium text-foreground">Status:</span>{' '}
                {data.is_active ? 'Active' : 'Inactive'}
            </div>

            {data.pattern_description && (
                <div className="pt-2 italic text-foreground">
                    {data.pattern_description}
                </div>
            )}
        </div>
    )
}

export default RecurringDisplay
