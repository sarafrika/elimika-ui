export default function CustomLoader() {
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <div className='flex animate-pulse flex-col items-center'>
        <div className='bg-secondary dark:bg-primary/30 mb-3 h-12 w-12 rounded-full'></div>
        <div className='bg-secondary dark:bg-primary/30 h-4 w-24 rounded'></div>
      </div>
    </div>
  );
}
