import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TokenEventCard } from './TokenEventCard';
import { Token } from '../types';
import { Palette } from 'lucide-react';

// Add debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

interface TokenEventsListProps {
  tokens: Token[];
  onColorsChange: (colors: {
    gradientColor1: string;
    gradientColor2: string;
    bgGradientColor1: string;
    bgGradientColor2: string;
  }) => void;
}

interface FilterState {
  minHolders: number;
  minLiquidity: number;
  hideHoneypots: boolean;
  showOnlyHoneypots: boolean;
  hideDanger: boolean;
  hideWarning: boolean;
  showOnlySafe: boolean;
  searchQuery: string;
  sortBy: 'creationTime' | 'holders' | 'liquidity' | 'safetyScore' | 'age' | 'records';
  sortDirection: 'asc' | 'desc';
  maxRecords: number;
  gradientColor1: string;
  gradientColor2: string;
  bgGradientColor1: string;
  bgGradientColor2: string;
  hideStagnantHolders: boolean;
  hideStagnantLiquidity: boolean;
  stagnantRecordCount: number;
}

// Add default filters constant
const DEFAULT_FILTERS: FilterState = {
  minHolders: 0,
  minLiquidity: 0,
  hideHoneypots: false,
  showOnlyHoneypots: false,
  hideDanger: false,
  hideWarning: false,
  showOnlySafe: false,
  searchQuery: '',
  sortBy: 'age',
  sortDirection: 'asc',
  maxRecords: 50,
  gradientColor1: '#9333ea',
  gradientColor2: '#ec4899',
  bgGradientColor1: '#111827',
  bgGradientColor2: '#374151',
  hideStagnantHolders: false,
  hideStagnantLiquidity: false,
  stagnantRecordCount: 10
};

export const TokenEventsList: React.FC<TokenEventsListProps> = ({ tokens, onColorsChange }) => {
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    const savedFilters = localStorage.getItem('tokenExplorerFilters');
    return savedFilters ? JSON.parse(savedFilters) : DEFAULT_FILTERS;
  });

  // Update handleFilterChange to apply changes immediately
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    localStorage.setItem('tokenExplorerFilters', JSON.stringify(newFilters));

    // If it's a color change, propagate to parent
    if (key.includes('Color')) {
      onColorsChange({
        gradientColor1: newFilters.gradientColor1,
        gradientColor2: newFilters.gradientColor2,
        bgGradientColor1: newFilters.bgGradientColor1,
        bgGradientColor2: newFilters.bgGradientColor2
      });
    }
  }, [filters, onColorsChange]);

  // Update color change handler
  const handleColorChange = useCallback((key: keyof FilterState, value: string) => {
    const input = document.querySelector(`input[data-color-input="${key}"]`) as HTMLInputElement;
    if (input) input.value = value;
    handleFilterChange(key, value);
  }, [handleFilterChange]);

  // Update restore defaults handler
  const handleRestoreDefaults = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    localStorage.setItem('tokenExplorerFilters', JSON.stringify(DEFAULT_FILTERS));
    onColorsChange({
      gradientColor1: DEFAULT_FILTERS.gradientColor1,
      gradientColor2: DEFAULT_FILTERS.gradientColor2,
      bgGradientColor1: DEFAULT_FILTERS.bgGradientColor1,
      bgGradientColor2: DEFAULT_FILTERS.bgGradientColor2
    });
  }, [onColorsChange]);

  // Memoize the filter function
  const filterTokens = useCallback((tokensToFilter: Token[]) => {
    if (!tokensToFilter || !Array.isArray(tokensToFilter)) {
      return [];
    }

    return tokensToFilter.filter(token => {
      const holderCount = token.gpHolderCount || 0;
      const liquidity = token.liq30 || 0;
      const isHoneypot = token.isHoneypot || false;
      const isDangerousBlacklist = token.gpIsBlacklisted && !token.gpIsAntiWhale;
      const isDangerous = isHoneypot || isDangerousBlacklist;
      const hasWarnings = !isDangerous && (
        !token.gpIsOpenSource ||
        token.gpIsProxy ||
        token.gpIsMintable ||
        token.gpExternalCall ||
        token.gpCannotBuy ||
        token.gpCannotSellAll ||
        token.gpTradingCooldown ||
        token.gpTransferPausable ||
        token.gpHiddenOwner ||
        token.gpCanTakeBackOwnership ||
        token.gpOwnerChangeBalance ||
        token.gpBuyTax > 10 ||
        token.gpSellTax > 10 ||
        (token.gpIsAntiWhale && token.gpAntiWhaleModifiable) ||
        token.gpSlippageModifiable
      );
      const isSafe = !isDangerous && !hasWarnings;

      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const nameMatch = token.name?.toLowerCase().includes(searchLower);
        const symbolMatch = token.symbol?.toLowerCase().includes(searchLower);
        if (!nameMatch && !symbolMatch) return false;
      }

      // Basic filters
      if (holderCount < filters.minHolders) return false;
      if (liquidity < filters.minLiquidity) return false;
      
      // Honeypot filters
      if (filters.hideHoneypots && isHoneypot) return false;
      if (filters.showOnlyHoneypots && !isHoneypot) return false;

      // Security level filters
      if (filters.hideDanger && isDangerous) return false;
      if (filters.hideWarning && hasWarnings) return false;
      if (filters.showOnlySafe && !isSafe) return false;

      // Stagnant token filters
      if (filters.hideStagnantHolders || filters.hideStagnantLiquidity) {
        const recordCount = token.totalScans || 0;
        if (recordCount >= filters.stagnantRecordCount) {
          // Check if holders are stagnant
          if (filters.hideStagnantHolders && !token.holdersChanged) {
            return false;
          }
          // Check if liquidity is stagnant
          if (filters.hideStagnantLiquidity && !token.liquidityChanged) {
            return false;
          }
        }
      }

      return true;
    }).slice(0, filters.maxRecords);
  }, [filters]);

  // Add sorting function
  const sortTokens = useCallback((tokensToSort: Token[]) => {
    return [...tokensToSort].sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'records':
          return direction * ((a.totalScans || 0) - (b.totalScans || 0));
        case 'age':
          return direction * ((a.ageHours || 0) - (b.ageHours || 0));
        case 'creationTime':
          if (!a.creationTime) return 0;
          const creationDateA = new Date(Number(a.creationTime) * 1000);
          const currentTimeA = new Date();
          const ageInMinutesA = Math.floor(
            (currentTimeA.getTime() - creationDateA.getTime()) / (1000 * 60)
          );
          if (!b.creationTime) return 0;
          const creationDateB = new Date(Number(b.creationTime) * 1000);
          const currentTimeB = new Date();
          const ageInMinutesB = Math.floor(
            (currentTimeB.getTime() - creationDateB.getTime()) / (1000 * 60)
          );
          return direction * (ageInMinutesA - ageInMinutesB);
        case 'holders':
          return direction * ((a.gpHolderCount || 0) - (b.gpHolderCount || 0));
        case 'liquidity':
          return direction * ((a.liq30 || 0) - (b.liq30 || 0));
        case 'safetyScore':
          const scoreA = a.isHoneypot ? 0 : (a.safetyScore || 0);
          const scoreB = b.isHoneypot ? 0 : (b.safetyScore || 0);
          return direction * (scoreA - scoreB);
        default:
          return 0;
      }
    });
  }, [filters.sortBy, filters.sortDirection]);

  // Update the useEffect to include sorting
  useEffect(() => {
    const filtered = filterTokens(tokens);
    const sorted = sortTokens(filtered);
    setFilteredTokens(sorted);
  }, [tokens, filterTokens, sortTokens]);

  if (!tokens || !Array.isArray(tokens)) {
    return <div className="text-center text-red-500">No tokens data available</div>;
  }

  if (tokens.length === 0) {
    return <div className="text-center text-gray-500">No tokens found</div>;
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col" style={{
      background: `linear-gradient(to right, ${filters.bgGradientColor1}, ${filters.bgGradientColor2})`
    }}>
      {/* Settings Bar - Now horizontal under top bar */}
      <div className="w-[90%] mx-auto pt-[2.75rem] mb-4">
        <div className={`bg-gradient-to-r shadow-lg border border-gray-500 rounded-xl p-2`} 
             style={{
               background: `linear-gradient(to right, ${filters.gradientColor1}E6, ${filters.gradientColor2}E6)`
             }}>
          <div className="flex gap-4">
            {/* Color Settings */}
            <div className="flex-none w-[200px]">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center justify-between text-white/90 hover:text-white group mb-1"
              >
                <span className="text-xs font-normal font-['Bebas_Neue'] tracking-wide flex items-center gap-1">
                  Theme Colors
                  <Palette 
                    size={12}
                    className={`transition-transform ${showColorPicker ? 'rotate-180' : ''} group-hover:scale-110`}
                  />
                </span>
              </button>

              {showColorPicker && (
                <div className="space-y-1 animate-fadeIn">
                  {/* Color picker inputs */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-white/90">Widget 1</label>
                      <input
                        type="color"
                        data-color-input="gradientColor1"
                        value={filters.gradientColor1}
                        onChange={(e) => handleColorChange('gradientColor1', e.target.value)}
                        className="h-6 w-full rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-white/90">Widget 2</label>
                      <input
                        type="color"
                        data-color-input="gradientColor2"
                        value={filters.gradientColor2}
                        onChange={(e) => handleColorChange('gradientColor2', e.target.value)}
                        className="h-6 w-full rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-white/90">BG 1</label>
                      <input
                        type="color"
                        data-color-input="bgGradientColor1"
                        value={filters.bgGradientColor1}
                        onChange={(e) => handleColorChange('bgGradientColor1', e.target.value)}
                        className="h-6 w-full rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-white/90">BG 2</label>
                      <input
                        type="color"
                        data-color-input="bgGradientColor2"
                        value={filters.bgGradientColor2}
                        onChange={(e) => handleColorChange('bgGradientColor2', e.target.value)}
                        className="h-6 w-full rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search and Max Results */}
            <div className="flex-none w-[200px] space-y-1">
              <div>
                <label className="block text-[10px] font-medium text-white/90">Search Token</label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  placeholder="Enter token name..."
                  className="w-full rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-white/90">Max Results</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={filters.maxRecords}
                  onChange={(e) => handleFilterChange('maxRecords', parseInt(e.target.value) || 50)}
                  className="w-full rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex-none w-[200px]">
              <label className="block text-[10px] font-medium text-white/90">Sort By</label>
              <div className="flex gap-1">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-2/3 rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                >
                  <option value="records">Record Count</option>
                  <option value="age">Token Age</option>
                  <option value="creationTime">Creation Time</option>
                  <option value="holders">Holders</option>
                  <option value="liquidity">Liquidity</option>
                  <option value="safetyScore">Safety Score</option>
                </select>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                  className="w-1/3 rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                >
                  <option value="desc">Highest</option>
                  <option value="asc">Lowest</option>
                </select>
              </div>
            </div>

            {/* Minimum Values */}
            <div className="flex-none w-[200px]">
              <label className="block text-[10px] font-medium text-white/90">Minimum Values</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min Holders"
                  value={filters.minHolders}
                  onChange={(e) => handleFilterChange('minHolders', parseInt(e.target.value) || 0)}
                  className="w-1/2 rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Min Liquidity"
                  value={filters.minLiquidity}
                  onChange={(e) => handleFilterChange('minLiquidity', parseInt(e.target.value) || 0)}
                  className="w-1/2 rounded-md bg-gray-800 border-gray-500 text-white text-[10px] shadow-sm focus:border-white/30 focus:ring-white/30 h-6"
                />
              </div>
            </div>

            {/* Security Filters */}
            <div className="flex-none w-[200px]">
              <label className="block text-[10px] font-medium text-white/90">Security Filters</label>
              <div className="grid grid-cols-3 gap-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hideDanger}
                    onChange={(e) => handleFilterChange('hideDanger', e.target.checked)}
                    className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                  />
                  <span className="ml-1 text-[10px] text-white/90">Hide Danger</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hideWarning}
                    onChange={(e) => handleFilterChange('hideWarning', e.target.checked)}
                    className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                  />
                  <span className="ml-1 text-[10px] text-white/90">Hide Warning</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOnlySafe}
                    onChange={(e) => handleFilterChange('showOnlySafe', e.target.checked)}
                    className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                  />
                  <span className="ml-1 text-[10px] text-white/90">Only Safe</span>
                </label>
              </div>
            </div>

            {/* Honeypot and Stagnant Filters */}
            <div className="flex-none w-[200px]">
              <div className="space-y-1">
                <div>
                  <label className="block text-[10px] font-medium text-white/90">Honeypot</label>
                  <div className="flex gap-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hideHoneypots}
                        onChange={(e) => handleFilterChange('hideHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                      />
                      <span className="ml-1 text-[10px] text-white/90">Hide</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showOnlyHoneypots}
                        onChange={(e) => handleFilterChange('showOnlyHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                      />
                      <span className="ml-1 text-[10px] text-white/90">Only</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/90">Stagnant</label>
                  <div className="flex gap-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hideStagnantHolders}
                        onChange={(e) => handleFilterChange('hideStagnantHolders', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                      />
                      <span className="ml-1 text-[10px] text-white/90">Holders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hideStagnantLiquidity}
                        onChange={(e) => handleFilterChange('hideStagnantLiquidity', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30 h-3 w-3"
                      />
                      <span className="ml-1 text-[10px] text-white/90">Liq</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Restore */}
            <div className="flex-none w-[200px] flex flex-col justify-between">
              <div className="text-[10px] text-white/80">
                Showing {filteredTokens.length} of {tokens.length} tokens
              </div>
              <button
                onClick={handleRestoreDefaults}
                className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] rounded transition-colors self-end"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="w-[90%] mx-auto">
          <div className="space-y-8">
            {filteredTokens.map((token, index) => (
              <div key={token.token_address} className="w-full">
                <div className="w-full">
                  <div className="p-8 bg-transparent rounded-xl border border-gray-500">
                    <TokenEventCard token={token} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
