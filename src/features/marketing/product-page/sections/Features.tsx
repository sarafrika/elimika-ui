import {
  BookOpen,
  Building2,
  CreditCard,
  type LucideIcon,
  Map as MapIcon,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const FEATURES: ReadonlyArray<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: CreditCard,
    title: 'Skills Card',
    body: 'Upload, verify and showcase skills in one place with a portable, lifelong skills identity.',
  },
  {
    icon: Building2,
    title: 'Employer Access',
    body: 'Share verified skills instantly so employers can recruit smarter with trusted talent data.',
  },
  {
    icon: TrendingUp,
    title: 'Student Growth',
    body: 'Track learning progress from school to career with clear milestones and outcomes.',
  },
  {
    icon: Wallet,
    title: 'Skills Fund',
    body: 'Access scholarships, bursaries, apprenticeships, scholarships and approved training support.',
  },
  {
    icon: MapIcon,
    title: 'Talent Map',
    body: 'Benchmark skills, discover opportunities and match to jobs or consultancies aligned to your profile.',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    body: 'Improve employability, earn approved credit and switch across learning and work seamlessly.',
  },
];

export function Features() {
  return (
    <section className='skills-wallet-section site-container'>
      <div className='skills-wallet-section__intro'>
        <p className='eyebrow accent-text'>Key features</p>
        <h2>Everything needed to learn, prove skills and move into opportunity.</h2>
        <p>
          Elimika connects skills records, funding, training and verified talent access in a single
          digital wallet experience.
        </p>
      </div>

      <div className='skills-wallet-card-grid'>
        {FEATURES.map(feature => {
          const Icon = feature.icon;

          return (
            <article className='skills-wallet-feature-card' key={feature.title}>
              <span>
                <Icon aria-hidden='true' size={22} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
