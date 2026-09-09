'use client';

import { ChevronRight, Menu, Search, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const SARAFRIKA_HOME = 'https://sarafrika.com';
const SARAFRIKA_LOGO = 'https://cms.sarafrika.com/api/media/file/sarafrika-logo.svg';

const NAV_LINKS = [
  { label: 'Products', href: `${SARAFRIKA_HOME}/products` },
  { label: 'Solutions', href: `${SARAFRIKA_HOME}/solutions` },
  { label: 'Marketplace', href: `${SARAFRIKA_HOME}/marketplace` },
  { label: 'Partners', href: `${SARAFRIKA_HOME}/partners` },
  { label: 'About Us', href: `${SARAFRIKA_HOME}/about` },
  { label: 'Contact', href: `${SARAFRIKA_HOME}/contact` },
] as const;

export function ProductNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className='site-header'>
        <div className='site-header__inner'>
          <a
            className='brand'
            aria-label='Sarafrika Home'
            href={SARAFRIKA_HOME}
            target='_blank'
            rel='noopener noreferrer'
          >
            {/* cms.sarafrika.com is not in next.config remotePatterns, so this stays a plain img. */}
            <img src={SARAFRIKA_LOGO} alt='Sarafrika' width={1400} height={900} decoding='async' />
          </a>

          <nav className='site-nav' aria-label='Primary navigation'>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} target='_blank' rel='noopener noreferrer'>
                {link.label}
              </a>
            ))}
          </nav>

          <div className='header-actions'>
            <button
              type='button'
              className='icon-button'
              title='Search Sarafrika'
              aria-label='Search Sarafrika'
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(open => !open)}
            >
              <Search size={18} />
            </button>

            <Link className='icon-button' href='/cart' title='Open cart' aria-label='Open cart'>
              <ShoppingCart size={18} />
            </Link>

            <button
              type='button'
              className='icon-button mobile-menu-button'
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMenuOpen(open => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className='site-search'>
            <form className='site-search__form' action='/courses' role='search'>
              <label className='sr-only' htmlFor='sw-header-search'>
                Search courses
              </label>
              <input
                id='sw-header-search'
                className='site-search__input'
                type='search'
                name='q'
                placeholder='Search courses'
                autoComplete='off'
              />
              <button type='submit' className='button button--accent'>
                Search
              </button>
            </form>
          </div>
        ) : null}

        {menuOpen ? (
          <nav className='mobile-nav' aria-label='Mobile navigation'>
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link href='/cart' onClick={() => setMenuOpen(false)}>
              Cart
            </Link>
          </nav>
        ) : null}
      </header>

      <nav aria-label='Breadcrumb' className='breadcrumb site-container'>
        <a href={SARAFRIKA_HOME} target='_blank' rel='noopener noreferrer'>
          Home
        </a>
        <span>
          <ChevronRight size={14} aria-hidden='true' />
        </span>
        <a href={`${SARAFRIKA_HOME}/products`} target='_blank' rel='noopener noreferrer'>
          Products
        </a>
        <span>
          <ChevronRight size={14} aria-hidden='true' />
        </span>
        <strong>Elimika</strong>
      </nav>
    </>
  );
}
