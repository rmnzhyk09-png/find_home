import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Loader2, Sparkles, ArrowUpRight, Copy, Check } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { api, parseNaturalLanguage, filtersToQueryString, getSuggestions } from '@/lib/api';
import type { ChatResponse, ChatMessage, SearchFilters, Apartment } from '@/types';
import { cn, formatPrice, formatArea, getSourceColor, generateId, getRelativeTime, pluralVariants } from '@/lib/utils';
import { useHistoryStore } from '@/lib/stores';

interface ChatInterfaceProps {
  onSearchResults?: (response: ChatResponse) => void;
  onViewModeChange?: (mode: 'catalog') => void;
}

const WELCOME_MESSAGES = [
  'Привет! Я помогу найти квартиру мечты 🏠',
  'Напиши, что ищешь: «2-комнатную до 5 млн в Новосибирске»',
  'Или выбери популярный запрос ниже ⬇️',
];

const THINKING_MESSAGES = [
  'Ищу по базам Дом.РФ, M2.ru, Циан, ДомКлик...',
  'Анализирую объявления...',
  'Фильтрую по твоим критериям...',
  'Почти готово!',
];

export function ChatInterface({ onSearchResults, onViewModeChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { add: addHistory } = useHistoryStore();

  // Initialize welcome messages
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage[] = WELCOME_MESSAGES.map((text, i) => ({
        id: generateId(),
        text,
        fromUser: false,
        timestamp: new Date(Date.now() + i * 100),
      }));
      setMessages(welcome);
    }
  }, [messages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Thinking animation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Update suggestions based on input
  useEffect(() => {
    if (input.trim()) {
      setSuggestions(getSuggestions(input));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(true);
      setSuggestions([
        '2-комнатную до 5 млн в Новосибирске',
        '3-комнатную в Заельцовском районе',
        'Студию до 3 млн без комиссии',
        'Новостройку с ипотекой',
      ]);
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      text: input.trim(),
      fromUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input.trim();
    setInput('');
    setIsLoading(true);
    setThinkingIndex(0);
    setShowSuggestions(false);

    try {
      const response = await api.chat(query);
      
      // Add to history
      addHistory(query, response.filters, response.totalCount);

      const botMessage: ChatMessage = {
        id: generateId(),
        text: response.response,
        fromUser: false,
        timestamp: new Date(),
        apartments: response.items,
        filters: response.filters,
      };

      setMessages((prev) => [...prev, botMessage]);
      onSearchResults?.(response);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        text: 'Произошла ошибка при поиске. Попробуй ещё раз или уточни запрос.',
        fromUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  const handleCopyFilters = (filters: SearchFilters) => {
    const text = filtersToQueryString(filters);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn('flex gap-3', message.fromUser && 'flex-row-reverse')}
            >
              <Avatar
                size="sm"
                fallback={message.fromUser ? 'Вы' : 'KP'}
                className="flex-shrink-0 mt-1"
              />
              <div className={cn('max-w-[80%]', message.fromUser ? 'text-right' : 'text-left')}>
                <div
                  className={cn(
                    'inline-block rounded-2xl px-4 py-2.5 text-base',
                    message.fromUser
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{THINKING_MESSAGES[thinkingIndex]}</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}

                  {/* Apartments preview in chat */}
                  {message.apartments && message.apartments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.apartments.slice(0, 3).map((apt: Apartment, i: number) => (
                        <motion.div
                          key={apt.url + i}
                          initial={{ opacity: 0, x: message.fromUser ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            'p-3 rounded-xl border bg-card text-left',
                            message.fromUser ? 'border-primary/20' : 'border-muted'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{apt.address}</span>
                            <span className="font-bold text-primary whitespace-nowrap">{formatPrice(apt.price)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="px-2 py-0.5">{apt.rooms}-к</Badge>
                            <span>{formatArea(apt.area)}</span>
                            <span>•</span>
                            <Badge variant={getSourceColor(apt.source).includes('blue') ? 'info' : getSourceColor(apt.source).includes('green') ? 'success' : 'outline'} className="px-2 py-0.5">
                              {apt.source}
                            </Badge>

                          </div>
                        </motion.div>
                      ))}
                      {message.apartments.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onViewModeChange?.('catalog')}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Показать все {message.apartments.length} {pluralVariants(message.apartments.length)}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Filters info */}
                  {message.filters && !message.fromUser && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.filters.rooms && (
                        <Badge variant="secondary" className="px-2 py-0.5">{message.filters.rooms}-к</Badge>
                      )}
                      {message.filters.maxPrice && (
                        <Badge variant="outline" className="px-2 py-0.5">до {(message.filters.maxPrice / 1e6).toFixed(1)} млн</Badge>
                      )}
                      {message.filters.district && (
                        <Badge variant="outline" className="px-2 py-0.5">{message.filters.district}</Badge>
                      )}
                      {message.filters.minArea && (
                        <Badge variant="outline" className="px-2 py-0.5">от {message.filters.minArea} м²</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => handleCopyFilters(message.filters!)}
                        aria-label="Скопировать фильтры"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <span>{getRelativeTime(message.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Avatar size="sm" fallback="KP" className="flex-shrink-0 mt-1" />
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{THINKING_MESSAGES[thinkingIndex]}</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all whitespace-nowrap"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напиши, какую квартиру ищешь..."
              className="pr-12"
              disabled={isLoading}
              aria-label="Поисковый запрос"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 h-9 w-9 text-muted-foreground hover:text-primary"
              onClick={() => { /* Voice input placeholder */ }}
              disabled={isLoading}
              aria-label="Голосовой ввод"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <Button
            size="lg"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-11"
            aria-label="Отправить"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Поиск по Дом.РФ, M2.ru, Циан, ДомКлик •{' '}
          <span className="flex inline-items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            ИИ-парсинг естественного языка
          </span>
        </p>
      </div>
    </div>
  );
}