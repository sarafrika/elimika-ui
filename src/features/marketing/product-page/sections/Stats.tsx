const STATS = [
  { value: '1', label: 'Universal learner account' },
  { value: '24/7', label: 'Shareable credentials' },
  { value: '60%', label: 'Employability readiness' },
  { value: 'KSh', label: 'Training funded formally' },
] as const;

export function Stats() {
  return (
    <section className='skills-wallet-stats site-container'>
      {STATS.map(stat => (
        <div key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
