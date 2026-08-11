import { Skeleton } from '@/components/ui/skeleton'

export default function SkillsFundLoading() {
  return (
    <div className='min-h-screen bg-muted/30 px-4 py-6'>
      <div className='space-y-4'>
        <Skeleton className='h-8 w-56' />
        <div className='flex gap-2 overflow-x-auto'>
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className='h-9 w-24 rounded-full' />
          ))}
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Skeleton className='h-48' />
          <Skeleton className='h-48' />
        </div>
        <Skeleton className='h-72' />
      </div>
    </div>
  )
}
