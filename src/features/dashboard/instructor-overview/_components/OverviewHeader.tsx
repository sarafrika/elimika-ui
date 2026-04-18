type OverviewHeaderProps = {
  firstName: string;
};

export function OverviewHeader({ firstName }: OverviewHeaderProps) {
  return (
    <header className='px-1 pt-1'>
      <h1 className='text-[2rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.25rem] lg:text-[2.5rem]'>
        Welcome back, {firstName}!
      </h1>
    </header>
  );
}
