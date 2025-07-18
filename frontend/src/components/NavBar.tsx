import React, { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

interface NavItem {
  label: string;
  path?: string;
  url?: string;
}

interface NavbarProps {
  items: NavItem[];
  handleTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = (props: NavbarProps) => {

  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>();
  const menuRef = useRef<HTMLDivElement>(null);

  function selectTab(navItem: NavItem) {
    if (navItem.url) {
      window.open(navItem.url,'_blank');
      return;
    }
    setActiveItem(navItem.path);
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

  return (
    <nav className="bg-slate-800 shadow-md max-w-[100vw] border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <span className="text-slate-300 text-xl font-bold font-sans tracking-tighter">
              Eurovision Analytics
            </span>
            <div className="hidden lg:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {props.items.map((item) => (
                  <button
                    key={item.path}
                    className={`${activeItem === item.path && !item.url
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                    onClick={() => selectTab(item)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div ref={menuRef} className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-1 mr-6 text-gray-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors duration-200 rounded-md"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <div className={`relative w-6 h-6`}>
                <div
                  className={`absolute top-1 left-0 w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? 'top-1/2 rotate-45 transform -translate-y-1/2' : ''
                    }`}
                ></div>
                <div
                  className={`absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''
                    }`}
                ></div>
                <div
                  className={`absolute bottom-1 left-0 w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? 'bottom-1/2 -rotate-45 transform translate-y-1/2' : ''
                    }`}
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div className="-mr-2 flex md:hidden overflow-hidden">
        <CSSTransition
          in={isOpen}
          timeout={500}
          classNames="menu-transition"
          unmountOnExit
        >
          <div className="md:hidden min-w-full bg-slate-800 border-t border-slate-700" id="mobile-menu">
            <div className="rounded-lg px-2 pt-2 pb-3 space-y-1 pr-4 min-w-full">
              {props.items.map((item) => (
                <button
                  key={item.path}
                  className={`${activeItem === item.path && !item.url
                      ? 'bg-slate-700 text-slate-300 font-bold'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-slate-200'
                    } block rounded-lg px-3 py-2 text-base font-medium min-w-full text-left pl-3 transition-colors duration-200`}
                  onClick={() => { selectTab(item) }}
                >
                  {item.label}
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