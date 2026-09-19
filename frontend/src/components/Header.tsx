import classnames from 'classnames';
import React from 'react';
import { eyebrow, hairline } from '../theme';

interface HeaderProps {
    title: string
    eyebrow?: string
    className?: string
  }


const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <div className={classnames("max-w-7xl mx-auto px-4 sm:px-10 mt-12", props.className)}>
            {props.eyebrow && (
                <p className={classnames(eyebrow, "text-center mb-1.5")}>{props.eyebrow}</p>
            )}
            <h1 className="text-xl font-semibold text-center text-[var(--er-text-primary)] tracking-tight">
                {props.title}
            </h1>
            <div className={classnames(hairline, "mt-4 max-w-md mx-auto")}></div>
        </div>
    );
};

export default Header;
