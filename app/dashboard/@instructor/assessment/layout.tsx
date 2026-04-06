interface AssessmentLayoutProps {
  children: React.ReactNode;
}

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return <div className='space-y-8 p-2 sm:p-6 lg:p-10'>{children}</div>;
}
