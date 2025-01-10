import React, { useEffect, useState, useCallback } from 'react';
import { TokenEventCard } from './TokenEventCard';
import { Token } from '../types';

interface TokenEventsListProps {
  tokens: Token[];
}

interface FilterState {
  minHolders: number;
  minLiquidity: number;
  hideHoneypots: boolean;
  showOnlyHoneypots: boolean;
  sortBy: 'creationTime' | 'holders' | 'liquidity' | 'safetyScore';
  sortDirection: 'asc' | 'desc';
  maxRecords: number;
}

export const TokenEventsList: React.FC<TokenEventsListProps> = ({ tokens }) => {
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    minHolders: 0,
    minLiquidity: 0,
    hideHoneypots: false,
    showOnlyHoneypots: false,
    sortBy: 'creationTime',
    sortDirection: 'desc',
    maxRecords: 50
  });

  // Memoize the filter function
  const filterTokens = useCallback((tokensToFilter: Token[]) => {
    if (!tokensToFilter || !Array.isArray(tokensToFilter)) {
      return [];
    }

    return tokensToFilter.filter(token => {
      const holderCount = token.gpHolderCount || 0;
      const liquidity = token.liq30 || 0;
      const isHoneypot = token.isHoneypot || false;

      if (holderCount < filters.minHolders) return false;
      if (liquidity < filters.minLiquidity) return false;
      if (filters.hideHoneypots && isHoneypot) return false;
      if (filters.showOnlyHoneypots && !isHoneypot) return false;

      return true;
    }).slice(0, filters.maxRecords);
  }, [filters]);

  // Add sorting function
  const sortTokens = useCallback((tokensToSort: Token[]) => {
    return [...tokensToSort].sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'creationTime':
          const timeA = a.pairInfo?.creationTime || 0;
          const timeB = b.pairInfo?.creationTime || 0;
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

  const handleFilterChange = useCallback((key: keyof FilterState, value: number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  if (!tokens || !Array.isArray(tokens)) {
    return <div className="text-center text-red-500">No tokens data available</div>;
  }

  if (tokens.length === 0) {
    return <div className="text-center text-gray-500">No tokens found</div>;
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="flex flex-1">
        {/* Side Status Bar - Changed to fixed positioning */}
        <div className="w-64 flex-none border-r border-gray-300">
          <div className="fixed w-64 pl-8">
            <div className="pt-[5.5rem]">
              {/* Filter Panel */}
              <div className="bg-gradient-to-b from-purple-600/90 to-pink-600/90 backdrop-blur-md shadow-lg border border-gray-500 rounded-xl p-4">
                <h2 className="text-lg font-normal mb-4 font-['Bebas_Neue'] text-white border-b border-gray-500 pb-2 tracking-wide">Filters & Sorting</h2>
                
                <div className="space-y-4">
                  {/* Add the new filter before the sorting controls */}
                  <div className="border border-gray-500 rounded-lg p-2">
                    <label className="block text-sm font-medium text-white/90">
                      Maximum Results to Show
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={filters.maxRecords}
                      onChange={(e) => handleFilterChange('maxRecords', parseInt(e.target.value) || 50)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Sorting Controls */}
                  <div className="border border-gray-500 rounded-lg p-2">
                    <label className="block text-sm font-medium text-white/90">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white shadow-sm focus:border-white/30 focus:ring-white/30"
                    >
                      <option value="creationTime" className="bg-gray-800">Token Creation Time</option>
                      <option value="holders" className="bg-gray-800">Token Holders</option>
                      <option value="liquidity" className="bg-gray-800">Token Liquidity</option>
                      <option value="safetyScore" className="bg-gray-800">Safety Score</option>
                    </select>
                  </div>

                  {/* Sort Direction */}
                  <div className="border border-gray-500 rounded-lg p-2">
                    <label className="block text-sm font-medium text-white/90">
                      Sort Direction
                    </label>
                    <select
                      value={filters.sortDirection}
                      onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white shadow-sm focus:border-white/30 focus:ring-white/30"
                    >
                      <option value="desc" className="bg-gray-800">Highest First</option>
                      <option value="asc" className="bg-gray-800">Lowest First</option>
                    </select>
                  </div>

                  {/* Minimum Holders */}
                  <div className="border border-gray-500 rounded-lg p-2">
                    <label className="block text-sm font-medium text-white/90">
                      Minimum Holders
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={filters.minHolders}
                      onChange={(e) => handleFilterChange('minHolders', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Minimum Liquidity */}
                  <div className="border border-gray-500 rounded-lg p-2">
                    <label className="block text-sm font-medium text-white/90">
                      Minimum Liquidity ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={filters.minLiquidity}
                      onChange={(e) => handleFilterChange('minLiquidity', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md bg-gray-800 border-gray-500 text-white shadow-sm focus:border-white/30 focus:ring-white/30"
                    />
                  </div>

                  {/* Honeypot Controls */}
                  <div className="border border-gray-500 rounded-lg p-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hideHoneypots}
                        onChange={(e) => handleFilterChange('hideHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-sm text-white/90">Hide Honeypots</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showOnlyHoneypots}
                        onChange={(e) => handleFilterChange('showOnlyHoneypots', e.target.checked)}
                        className="rounded border-gray-500 bg-gray-800 text-pink-600 shadow-sm focus:border-white/30 focus:ring-white/30"
                      />
                      <span className="ml-2 text-sm text-white/90">Show Only Honeypots</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-500">
                    <p className="text-sm text-white/80">
                      Showing {filteredTokens.length} of {tokens.length} tokens
                    </p>
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
