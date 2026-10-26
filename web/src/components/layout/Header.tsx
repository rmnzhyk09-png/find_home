import { motion } from 'framer-motion';
import { Menu, Search, Heart, History, Sun, Moon, Monitor, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useUIStore, useTheme } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  viewMode: 'chat' | 'catalog' | 'favorites' | 'history';
  onViewModeChange: (mode: 'chat' | 'catalog' | 'favorites' | 'history') => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  favoritesCount: number;
}

const NAV_ITEMS = [
  { id: 'chat', label: 'Чат', icon: Sparkles, shortcut: '⌘1' },
  { id: 'catalog', label: 'Каталог', icon: Search, shortcut: '⌘2' },
  { id: 'favorites', label: 'Избранное', icon: Heart, shortcut: '⌘3' },
  { id: 'history', label: 'История', icon: History, shortcut: '⌘4' },
] as const;

export function Header({ 
  onMenuClick, 
  viewMode, 
  onViewModeChange, 
  sidebarOpen, 
  onToggleSidebar,
  favoritesCount 
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Меню">
            <Menu className="h-5 w-5" />
          </Button>
          
          <motion.button
            onClick={() => onViewModeChange('chat')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">Kvartira Pro</span>
          </motion.button>
        </div>

        {/* Center: Navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-muted rounded-xl px-1 py-1" aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => {
            const isActive = viewMode === item.id;
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'gap-2 px-3 py-1.5 rounded-lg transition-all',
                  isActive && 'shadow-soft'
                )}
                onClick={() => onViewModeChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.id === 'favorites' && favoritesCount > 0 && (
                  <span className="h-4 min-w-4 px-1.5 text-xs rounded-full bg-red-500 text-white">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Right: Theme toggle + Sidebar toggle */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            className="relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="h-5 w-5 absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Sidebar toggle (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Скрыть панель' : 'Показать панель'}
            className="hidden lg:flex"
          >
            <Monitor className={cn('h-5 w-5 transition-transform', sidebarOpen && 'rotate-180')} />
          </Button>

          {/* Mobile avatar placeholder */}
          <Avatar size="sm" fallback="Вы" className="hidden sm:flex" />
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden px-4 pb-3">
        <div className="grid grid-cols-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = viewMode === item.id;
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="py-2 px-1 gap-1"
                onClick={() => onViewModeChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
                {item.id === 'favorites' && favoritesCount > 0 && (
                  <span className="h-3 min-w-3 px-1 text-[10px] rounded-full bg-red-500 text-white">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </header>
  );
}