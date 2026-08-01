interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return (
    <div className='relative flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between'>
      {/* Left teal accent bar */}
      <span
        aria-hidden
        className='to-primary absolute top-0 -left-4 hidden h-8 w-1 rounded-full bg-gradient-to-b from-teal-600 sm:block'
      />
      <div className='space-y-1'>
        {eyebrow && (
          <p className='text-primary text-xs font-semibold tracking-wider uppercase'>{eyebrow}</p>
        )}
        <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h1>
        {description && <p className='text-muted-foreground max-w-2xl text-sm'>{description}</p>}
      </div>
      {action && <div className='flex flex-wrap gap-2'>{action}</div>}
    </div>
  );
}
