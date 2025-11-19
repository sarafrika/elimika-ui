export default function CustomLoader() {
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
        <div className='flex animate-pulse flex-col items-center'>
          <div className='mb-3 h-12 w-12 rounded-full bg-secondary dark:bg-primary/30'></div>
          <div className='h-4 w-24 rounded bg-secondary dark:bg-primary/30'></div>
        </div>
      </div>
  );
}
