import classnames from 'classnames';
import React from 'react';

interface HeaderProps {
    title: string
    className?: string
  }

  
const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <div className={classnames("w-[100vw] bg-slate-700 py-3 z-0 min-w-[100vw] mt-4", props.className)}>
            <h1 className="text-lg font-semibold text-center text-slate-300 tracking-tighter">
                {props.title}
            </h1>
        </div>
    );
};

export default Header;