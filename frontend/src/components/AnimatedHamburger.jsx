import React from 'react';

export const AnimatedHamburger = ({ isOpen, onClick, title, className = '', style = {} }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hamburger-btn ${isOpen ? 'is-active' : ''} ${className}`}
      title={title || (isOpen ? 'Close menu' : 'Open menu')}
      aria-label={title || (isOpen ? 'Close menu' : 'Open menu')}
      aria-expanded={isOpen}
      style={style}
    >
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
    </button>
  );
};
