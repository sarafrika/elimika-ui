import { Circle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const SARAFRIKA_HOME = 'https://sarafrika.com';
const SARAFRIKA_LOGO = 'https://cms.sarafrika.com/api/media/file/sarafrika-logo.svg';

// Elimika destinations, not the Sarafrika site map — the chrome belongs to
// this product even though the body mirrors the marketing page.
const EXPLORE_LINKS = [
  { label: 'Course catalogue', href: '/courses' },
  { label: 'Skills Wallet', href: '/skills-wallet' },
  { label: 'Help centre', href: '/help' },
  { label: 'Cart', href: '/cart' },
] as const;

const COMPANY_LINKS = [
  { label: 'About Sarafrika', href: `${SARAFRIKA_HOME}/about` },
  { label: 'Partners', href: `${SARAFRIKA_HOME}/partners` },
  { label: 'Contact', href: `${SARAFRIKA_HOME}/contact` },
  { label: 'Book a Demo', href: `${SARAFRIKA_HOME}/book-a-demo` },
] as const;

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Twitter', href: 'https://twitter.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
] as const;

export function ProductFooter() {
  return (
    <footer className='site-footer'>
      <div className='site-footer__inner'>
        <div className='footer-brand'>
          <a
            className='brand brand--footer'
            aria-label='Sarafrika Home'
            href={SARAFRIKA_HOME}
            target='_blank'
            rel='noopener noreferrer'
          >
            {/* cms.sarafrika.com is not in next.config remotePatterns, so this stays a plain img. */}
            <img
              src={SARAFRIKA_LOGO}
              alt='Sarafrika'
              width={1400}
              height={900}
              loading='lazy'
              decoding='async'
            />
          </a>
          <p>
            One connected ecosystem for learning, talent, entertainment and community — built for
            Africa and the world.
          </p>
          <div className='footer-socials'>
            {SOCIAL_LINKS.map(social => (
              <a
                key={social.label}
                aria-label={social.label}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Circle size={17} aria-hidden='true' />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label='Explore' className='footer-links'>
          <strong>Explore</strong>
          <Link href='/'>Home</Link>
          {EXPLORE_LINKS.map(link => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label='Company' className='footer-links'>
          <strong>Company</strong>
          {COMPANY_LINKS.map(link => (
            <a key={link.label} href={link.href} target='_blank' rel='noopener noreferrer'>
              {link.label}
            </a>
          ))}
        </nav>

        <div className='footer-contact'>
          <strong>Get in touch</strong>
          <a href='mailto:hello@sarafrika.com'>
            <Mail size={16} aria-hidden='true' />
            hello@sarafrika.com
          </a>
          <a href='tel:+254717000059'>
            <Phone size={16} aria-hidden='true' />
            +254 717 000 059
          </a>
          <a
            className='button button--dark'
            href={`${SARAFRIKA_HOME}/book-a-demo`}
            target='_blank'
            rel='noopener noreferrer'
          >
            Book a Demo
          </a>
        </div>
      </div>

      <div className='site-footer__bottom'>
        <span>© 2026 Sarafrika. All rights reserved.</span>
        <span>Opportunity starts here.</span>
      </div>
    </footer>
  );
}
