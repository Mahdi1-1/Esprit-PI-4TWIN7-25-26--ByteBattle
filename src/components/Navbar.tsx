import { Link } from 'react-router';
import { Menu, Moon, Sun, Swords, Trophy, Code2, Users, Palette, PenTool, Type } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFontSize } from '../context/FontSizeContext';
import { Button } from './Button';
import { useState } from 'react';

interface NavbarProps {
  isLoggedIn?: boolean;
  userAvatar?: string;
  username?: string;
}

export function Navbar({ isLoggedIn = false, userAvatar, username }: NavbarProps) {
  const { colorScheme, toggleColorScheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFontSizePanel, setShowFontSizePanel] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface-1)] border-b border-[var(--border-default)] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-[var(--radius-sm)] flex items-center justify-center glow">
              <Code2 className="w-5 h-5 text-[var(--bg-primary)]" />
            </div>
            <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors font-title">
              ByteBattle
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link
                  to="/problems"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Problems</span>
                </Link>
                <Link
                  to="/canvas"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Canvas</span>
                </Link>
                <Link
                  to="/duel"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <Swords className="w-4 h-4" />
                  <span>Duel</span>
                </Link>
                <Link
                  to="/hackathon"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Hackathon</span>
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  to="/themes"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  <span>Thèmes</span>
                </Link>
              </>
            ) : null}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Font Size Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFontSizePanel(!showFontSizePanel)}
                className={`
                  w-10 h-10
                  flex items-center justify-center
                  rounded-[var(--radius-md)]
                  text-[var(--text-secondary)]
                  hover:bg-[var(--surface-2)]
                  hover:text-[var(--brand-primary)]
                  transition-colors
                  ${showFontSizePanel ? 'bg-[var(--surface-2)] text-[var(--brand-primary)]' : ''}
                `}
                aria-label="Adjust font size"
              >
                <Type className="w-5 h-5" />
              </button>

              {/* Font Size Panel */}
              {showFontSizePanel && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">Taille de police</span>
                    <span className="text-xs text-[var(--text-secondary)]">{fontSize}%</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">A</span>
                    <input
                      type="range"
                      min="75"
                      max="150"
                      step="5"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 h-2 bg-[var(--surface-2)] rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[var(--brand-primary)]
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:glow
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[var(--brand-primary)]
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <span className="text-base font-medium text-[var(--text-primary)]">A</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      onClick={() => setFontSize(fontSize - 5)}
                      disabled={fontSize <= 75}
                      className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] text-[var(--text-primary)] transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setFontSize(100)}
                      className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-[var(--radius-md)] text-[var(--text-primary)] transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setFontSize(fontSize + 5)}
                      disabled={fontSize >= 150}
                      className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] text-[var(--text-primary)] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleColorScheme}
              className="
                w-10 h-10
                flex items-center justify-center
                rounded-[var(--radius-md)]
                text-[var(--text-secondary)]
                hover:bg-[var(--surface-2)]
                hover:text-[var(--brand-primary)]
                transition-colors
              "
              aria-label="Toggle theme"
            >
              {colorScheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isLoggedIn ? (
              <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src={userAvatar}
                  alt={username}
                  className="w-10 h-10 rounded-full border-2 border-[var(--brand-primary)] glow"
                />
                <span className="hidden lg:block text-[var(--text-primary)] font-medium">
                  {username}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="
                md:hidden
                w-10 h-10
                flex items-center justify-center
                rounded-[var(--radius-md)]
                text-[var(--text-secondary)]
                hover:bg-[var(--surface-2)]
                transition-colors
              "
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden py-4 border-t border-[var(--border-default)]">
            <div className="flex flex-col gap-3">
              <Link
                to="/problems"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Code2 className="w-4 h-4" />
                <span>Problems</span>
              </Link>
              <Link
                to="/canvas"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <PenTool className="w-4 h-4" />
                <span>Canvas</span>
              </Link>
              <Link
                to="/duel"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Swords className="w-4 h-4" />
                <span>Duel</span>
              </Link>
              <Link
                to="/hackathon"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                <span>Hackathon</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </Link>
              <Link
                to="/themes"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Palette className="w-4 h-4" />
                <span>Thèmes</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}