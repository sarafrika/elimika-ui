
type SkillsFundHeaderProps = {
  profileName: string;
  title: string;
};

export function SkillsFundHeader({ profileName, title }: SkillsFundHeaderProps) {
  return (
    <header className='border-b border-border px-3 py-3 sm:px-4'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <h1 className='text-[1.75rem] font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-[2rem]'>
          {title}
        </h1>
        {/* <div className='flex items-center gap-2 text-sm text-slate-500 sm:text-[0.95rem]'>
          <Search className='size-4' />
          <span>{profileName}</span>
        </div> */}
      </div>
    </header>
  );
}
