import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const NavItem = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`text-ink uppercase tracking-terminal font-semibold hover:bg-highlight hover:text-invert px-1 sm:px-3 py-1 transition-none flex items-center ${
          isActive ? 'bg-highlight text-invert' : ''
        }`}
      >
        {/* Show brackets only on desktop */}
        <span className="hidden sm:inline">{isActive ? '[*]\u00A0' : '[\u00A0]\u00A0'}</span>
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-canvas border-b border-dotted border-structure sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-2 sm:px-6">
        <Link to="/" className="text-ink font-semibold uppercase tracking-terminal text-[10px] sm:text-sm hover:bg-highlight hover:text-invert px-1 sm:px-2 py-1 transition-none">
          [&nbsp;MANAV.IO&nbsp;]
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-6">
          <nav className="flex space-x-1 sm:space-x-6 text-[10px] sm:text-sm">
            <NavItem to="/" label="HOME" />
            <NavItem to="/projects" label="PROJECTS" />
            <NavItem to="/cv" label="CV" />
          </nav>
          <button
            onClick={toggleTheme}
            className="text-ink uppercase tracking-terminal font-semibold text-[10px] sm:text-sm border border-structure px-1 sm:px-3 py-1 hover:bg-highlight hover:text-invert hover:border-highlight transition-none flex items-center"
            aria-label="Toggle theme"
          >
            <span className="hidden sm:inline">{isDark ? '[\u00A0☀\u00A0LIGHT\u00A0]' : '[\u00A0☾\u00A0DARK\u00A0]'}</span>
            <span className="sm:hidden">{isDark ? '☀' : '☾'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
