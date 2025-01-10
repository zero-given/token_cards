import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TokenEventCard } from './TokenEventCard';
import { Token } from '../types';
import { Palette } from 'lucide-react';

// Add debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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

export const TokenEventsList: React.FC<TokenEventsListProps> = ({ tokens, onColorsChange }) => {
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
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
  });

  // Add temporary state for draft changes
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  // Update the handleFilterChange to modify draft state instead
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setDraftFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Add save changes handler
  const handleSaveChanges = useCallback(() => {
    setFilters(draftFilters);
    // Propagate color changes to parent
    onColorsChange({
      gradientColor1: draftFilters.gradientColor1,
      gradientColor2: draftFilters.gradientColor2,
      bgGradientColor1: draftFilters.bgGradientColor1,
      bgGradientColor2: draftFilters.bgGradientColor2
    });
  }, [draftFilters, onColorsChange]);

  // Reset changes handler
  const handleResetChanges = useCallback(() => {
    setDraftFilters(filters);
  }, [filters]);

  // Debounced color change handler
  const debouncedColorChange = useCallback(
    debounce((key: keyof FilterState, value: string) => {
      setDraftFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }, 100),
    []
  );

  // Immediate update for the input value, debounced update for the state
  const handleColorChange = useCallback((key: keyof FilterState, value: string) => {
    const input = document.querySelector(`input[data-color-input="${key}"]`) as HTMLInputElement;
    if (input) input.value = value;
    debouncedColorChange(key, value);
  }, [debouncedColorChange]);

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
          const timeA = a.creationTime || 0;
          const timeB = b.creationTime || 0;
          return direction * (timeA - timeB);
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
      background: `linear-gradient(to bottom right, ${filters.bgGradientColor1}, ${filters.bgGradientColor2})`
    }}>
      <div className="flex flex-1">
        {/* Side Status Bar - Changed to fixed positioning */}
        <div className="w-64 flex-none border-r border-gray-300">
          <div className="fixed w-64 pl-8">
            <div className="pt-[2.75rem]">
              {/* Filter Panel */}
              <div className={`bg-gradient-to-b shadow-lg border border-gray-500 rounded-xl p-3`} 
                   style={{
                     background: `linear-gradient(to bottom, ${filters.gradientColor1}E6, ${filters.gradientColor2}E6)`
                   }}>
                {/* Color Picker Toggle */}
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full flex items-center justify-between text-white/90 hover:text-white group mb-3"
                >
                  <span className="text-base font-normal font-['Bebas_Neue'] tracking-wide flex items-center gap-2">
                    Theme Colors
                    <Palette 
                      size={16}
                      className={`transition-transform ${showColorPicker ? 'rotate-180' : ''} group-hover:scale-110`}
                    />
                  </span>
                </button>

                {/* Color Pickers */}
                {showColorPicker && (
                  <div className="mb-3 space-y-3 animate-fadeIn">
                    <div className="flex flex-col space-y-1">
                      <label className="block text-xs font-medium text-white/90">
                        Widget Color 1
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          data-color-input="gradientColor1"
                          value={draftFilters.gradientColor1}
                          onChange={(e) => handleColorChange('gradientColor1', e.target.value)}
                          className="h-7 w-14 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draftFilters.gradientColor1}
                          onChange={(e) => handleColorChange('gradientColor1', e.target.value)}
                          className="flex-1 rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="block text-xs font-medium text-white/90">
                        Widget Color 2
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          data-color-input="gradientColor2"
                          value={draftFilters.gradientColor2}
                          onChange={(e) => handleColorChange('gradientColor2', e.target.value)}
                          className="h-7 w-14 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draftFilters.gradientColor2}
                          onChange={(e) => handleColorChange('gradientColor2', e.target.value)}
                          className="flex-1 rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="block text-xs font-medium text-white/90">
                        Background Color 1
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          data-color-input="bgGradientColor1"
                          value={draftFilters.bgGradientColor1}
                          onChange={(e) => handleColorChange('bgGradientColor1', e.target.value)}
                          className="h-7 w-14 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draftFilters.bgGradientColor1}
                          onChange={(e) => handleColorChange('bgGradientColor1', e.target.value)}
                          className="flex-1 rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="block text-xs font-medium text-white/90">
                        Background Color 2
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          data-color-input="bgGradientColor2"
                          value={draftFilters.bgGradientColor2}
                          onChange={(e) => handleColorChange('bgGradientColor2', e.target.value)}
                          className="h-7 w-14 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={draftFilters.bgGradientColor2}
                          onChange={(e) => handleColorChange('bgGradientColor2', e.target.value)}
                          className="flex-1 rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-base font-normal mb-3 font-['Bebas_Neue'] text-white border-b border-gray-500 pb-1 tracking-wide">Filters & Sorting</h2>
                
                <div className="space-y-3">
                  {/* Search Box */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Search Token Name
                    </label>
                    <input
                      type="text"
                      value={draftFilters.searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      placeholder="Enter token name..."
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30 placeholder-gray-500"
                    />
                  </div>

                  {/* Add the new filter before the sorting controls */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Maximum Results to Show
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={draftFilters.maxRecords}
                      onChange={(e) => handleFilterChange('maxRecords', parseInt(e.target.value) || 50)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Sorting Controls */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Sort By
                    </label>
                    <select
                      value={draftFilters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                    >
                      <option value="records" className="bg-gray-800">Record Count</option>
                      <option value="age" className="bg-gray-800">Token Age</option>
                      <option value="creationTime" className="bg-gray-800">Token Creation Time</option>
                      <option value="holders" className="bg-gray-800">Token Holders</option>
                      <option value="liquidity" className="bg-gray-800">Token Liquidity</option>
                      <option value="safetyScore" className="bg-gray-800">Safety Score</option>
                    </select>
                  </div>

                  {/* Sort Direction */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Sort Direction
                    </label>
                    <select
                      value={draftFilters.sortDirection}
                      onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                    >
                      <option value="desc" className="bg-gray-800">Highest First</option>
                      <option value="asc" className="bg-gray-800">Lowest First</option>
                    </select>
                  </div>

                  {/* Minimum Holders */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Minimum Holders
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={draftFilters.minHolders}
                      onChange={(e) => handleFilterChange('minHolders', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Minimum Liquidity */}
                  <div className="border border-gray-500 rounded-lg p-1.5">
                    <label className="block text-xs font-medium text-white/90">
                      Minimum Liquidity ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={draftFilters.minLiquidity}
                      onChange={(e) => handleFilterChange('minLiquidity', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Security Level Filters */}
                  <div className="border border-gray-500 rounded-lg p-1.5 space-y-1.5">
                    <h3 className="text-xs font-medium text-white/90 mb-1">Security Filters</h3>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={draftFilters.hideDanger}
                        onChange={(e) => handleFilterChange('hideDanger', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-xs text-white/90">Hide Dangerous Tokens</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={draftFilters.hideWarning}
                        onChange={(e) => handleFilterChange('hideWarning', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-xs text-white/90">Hide Warning Tokens</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={draftFilters.showOnlySafe}
                        onChange={(e) => handleFilterChange('showOnlySafe', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-xs text-white/90">Show Only Safe Tokens</span>
                    </label>
                  </div>

                  {/* Honeypot Controls */}
                  <div className="border border-gray-500 rounded-lg p-1.5 space-y-1.5">
                    <h3 className="text-xs font-medium text-white/90 mb-1">Honeypot Filters</h3>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={draftFilters.hideHoneypots}
                        onChange={(e) => handleFilterChange('hideHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-xs text-white/90">Hide Honeypots</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={draftFilters.showOnlyHoneypots}
                        onChange={(e) => handleFilterChange('showOnlyHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-xs text-white/90">Show Only Honeypots</span>
                    </label>
                  </div>

                  {/* Stagnant Token Filters */}
                  <div className="border border-gray-500 rounded-lg p-1.5 space-y-1.5">
                    <h3 className="text-xs font-medium text-white/90 mb-1">Stagnant Token Filters</h3>
                    
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={draftFilters.hideStagnantHolders}
                          onChange={(e) => handleFilterChange('hideStagnantHolders', e.target.checked)}
                          className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                        <span className="ml-2 text-xs text-white/90">Hide Tokens with Stagnant Holders</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={draftFilters.hideStagnantLiquidity}
                          onChange={(e) => handleFilterChange('hideStagnantLiquidity', e.target.checked)}
                          className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                        <span className="ml-2 text-xs text-white/90">Hide Tokens with Stagnant Liquidity</span>
                      </label>

                      <div>
                        <label className="block text-xs font-medium text-white/90">
                          Stagnant Record Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={draftFilters.stagnantRecordCount}
                          onChange={(e) => handleFilterChange('stagnantRecordCount', parseInt(e.target.value) || 10)}
                          className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white text-xs shadow-sm focus:border-white/30 focus:ring-white/30"
                        />
                        <p className="text-xs text-white/60 mt-1">
                          Number of records to check for stagnation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Save/Reset Buttons */}
                  <div className="pt-3 border-t border-gray-500 space-y-2">
                    <p className="text-xs text-white/80">
                      Showing {filteredTokens.length} of {tokens.length} tokens
                    </p>
                    <p className="text-xs text-white/80">
                      Records: {tokens.length}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveChanges}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleResetChanges}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pl-4 pb-8 border-l border-gray-600">
          <div className="w-[90%] mx-auto px-4 mt-[5.5rem]">
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
    </div>
  );
};
