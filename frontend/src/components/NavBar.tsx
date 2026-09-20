import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import HeartIcon from './HeartIcon';

interface NavItem {
  label: string;
  path?: string;
  url?: string;
}

interface NavbarProps {
  items: NavItem[];
  activePath: string;
  handleTabChange: (tab: string) => void;
}

const ExternalIcon: React.FC = () => (
  <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4.5 2.5h-2v7h7v-2M7 2.5h2.5V5M9.5 2.5 5.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Navbar: React.FC<NavbarProps> = (props: NavbarProps) => {

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // react-transition-group reaches for ReactDOM.findDOMNode without a nodeRef,
  // and that was removed in React 19
  const panelRef = useRef<HTMLDivElement>(null);

  function selectTab(navItem: NavItem) {
    if (navItem.url) {
      window.open(navItem.url,'_blank');
      return;
    }
    props.handleTabChange(navItem.path!);
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };

  }, [isOpen]);

  const isActive = (item: NavItem) => props.activePath === item.path && !item.url;

  return (
    <nav ref={menuRef} className="nav-diagonal-split-bg sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-10">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center">
            <span className="gradient-text product-name">
              Eurovision Analytics
            </span>
            <HeartIcon className="inline align-middle ml-[0.5em] mb-1 w-5 h-5 pulse-on-load" />
          </div>

          <ul className="hidden lg:flex items-center">
            {props.items.map((item) => (
              <li key={item.label}>
                <button
                  className={classNames(
                    'inline-flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors duration-200',
                    isActive(item)
                      ? 'text-[var(--er-interactive-primary)] border-[var(--er-interactive-primary)]'
                      : 'text-[var(--er-text-secondary)] border-transparent hover:text-[var(--er-text-muted)]'
                  )}
                  onClick={() => selectTab(item)}
                >
                  {item.label}
                  {item.url && <ExternalIcon />}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className={`relative w-5 h-5`}>
                <div
                  className={`absolute top-1 left-0 w-full h-0.5 rounded bg-current transition-all duration-300 ${isOpen ? 'top-1/2 rotate-45 transform -translate-y-1/2' : ''
                    }`}
                ></div>
                <div
                  className={`absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 rounded bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : ''
                    }`}
                ></div>
                <div
                  className={`absolute bottom-1 left-0 w-full h-0.5 rounded bg-current transition-all duration-300 ${isOpen ? 'bottom-1/2 -rotate-45 transform translate-y-1/2' : ''
                    }`}
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div className="flex lg:hidden overflow-hidden">
        <CSSTransition
          in={isOpen}
          nodeRef={panelRef}
          timeout={500}
          classNames="menu-transition"
          unmountOnExit
        >
          <div ref={panelRef} className="lg:hidden w-full border-t border-white/10" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {props.items.map((item) => (
                <button
                  key={item.label}
                  className={classNames(
                    'flex items-center gap-1.5 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors duration-150',
                    isActive(item)
                      ? 'bg-[color-mix(in_srgb,var(--er-surface-light)_20%,transparent)] text-[var(--er-interactive-text-light)] font-medium'
                      : 'text-[var(--er-text-secondary)] hover:bg-white/5'
                  )}
                  onClick={() => { selectTab(item); setIsOpen(false); }}
                >
                  {item.label}
                  {item.url && <ExternalIcon />}
                </button>
              ))}
            </div>
          </div>
        </CSSTransition>
      </div>
    </nav>
  );
};

export default Navbar;
