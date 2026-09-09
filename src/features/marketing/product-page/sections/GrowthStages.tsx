import { GraduationCap, type LucideIcon, School, Sparkles, UserCheck } from 'lucide-react';

const STAGES: ReadonlyArray<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: GraduationCap,
    title: 'For Students',
    body: 'Build a verified record of learning from early years and stay ready for higher education and work.',
  },
  {
    icon: UserCheck,
    title: 'For Professionals',
    body: 'Showcase career milestones, certifications, portfolios and continuing development.',
  },
  {
    icon: School,
    title: 'Schools & Colleges',
    body: 'Issue verifiable credentials that travel beyond the classroom and connect learning to outcomes.',
  },
  {
    icon: Sparkles,
    title: 'Training Providers',
    body: 'Offer credentials that unlock funding, trust, payment and transparent accreditation pathways.',
  },
];

export function GrowthStages() {
  return (
    <section className='skills-wallet-section site-container'>
      <div className='skills-wallet-section__intro'>
        <p className='eyebrow accent-text'>Built for every growth stage</p>
        <h2>From early learning to professional mobility.</h2>
      </div>

      <div className='skills-wallet-growth-grid'>
        {STAGES.map(stage => {
          const Icon = stage.icon;

          return (
            <article className='skills-wallet-feature-card' key={stage.title}>
              <span>
                <Icon aria-hidden='true' size={22} />
              </span>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
