import Spinner from './ui/spinner';

const PageLoader = () => {
  return (
    <div className='col-span-full flex items-center justify-center py-6'>
      <Spinner />
    </div>
  );
};

export default PageLoader;
