import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-canvas border-t border-dotted border-structure py-10 mt-20 text-center">
      <div className="flex justify-center flex-nowrap gap-[1vw] sm:gap-4 mb-6 text-[2.5vw] sm:text-sm font-semibold uppercase tracking-terminal px-1 sm:px-4 w-full">
        <a href="https://instagram.com/manav.2009" target="_blank" rel="noopener noreferrer" className="text-ink hover:bg-ink hover:text-invert px-2 py-1 transition-none flex items-center">
          [&nbsp;INSTAGRAM&nbsp;]
        </a>
        <a href="https://github.com/ManavSanghrajka" target="_blank" rel="noopener noreferrer" className="text-ink hover:bg-ink hover:text-invert px-2 py-1 transition-none flex items-center">
          [&nbsp;GITHUB&nbsp;]
        </a>
        <a href="https://open.spotify.com/user/316ntxr3gfsimuv6cwvsg3dabxn4" target="_blank" rel="noopener noreferrer" className="text-ink hover:bg-ink hover:text-invert px-2 py-1 transition-none flex items-center">
          [&nbsp;SPOTIFY&nbsp;]
        </a>
        <a href="https://linkedin.com/in/manav-sanghrajka-654a73363/" target="_blank" rel="noopener noreferrer" className="text-ink hover:bg-ink hover:text-invert px-2 py-1 transition-none flex items-center">
          [&nbsp;LINKEDIN&nbsp;]
        </a>
        <a href="mailto:manavsanghrajka@gmail.com" className="text-ink hover:bg-ink hover:text-invert px-2 py-1 transition-none flex items-center">
          [&nbsp;EMAIL&nbsp;]
        </a>
      </div>

      <p className="text-ink/50 text-[2vw] sm:text-xs tracking-terminal uppercase">
        © 2026 MANAV | BUILT WITH REACT + VITE
      </p>
    </footer>
  );
};

export default Footer;
