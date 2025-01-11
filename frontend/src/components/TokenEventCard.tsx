import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Info, Activity, FileText, Lock, Users, AlertTriangle, DollarSign, Network, Clock } from 'lucide-react';
import { Token } from '../types';
import { TokenLiquidityChart } from './TokenLiquidityChart';

interface TokenEventCardProps {
  token: Token;
}

const securityStatus = {
  safe: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger: 'bg-red-100 text-red-800 border border-red-200',
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center space-x-1.5 mb-2 border-b border-gray-200 pb-1">
    {icon}
    <h4 className="text-base font-semibold text-gray-800">{title}</h4>
  </div>
);

const Field: React.FC<{ label: string; value: any; truncate?: boolean }> = ({ label, value, truncate }) => (
  <div className="mb-1">
    <span className="text-xs font-medium text-gray-600">{label}: </span>
    <span className={`text-xs text-gray-800 ${truncate ? 'truncate block' : ''}`}>
      {value === undefined || value === null ? 'N/A' : value.toString()}
    </span>
  </div>
);

export const TokenEventCard: React.FC<TokenEventCardProps> = ({ token }) => {
  const getWarningReasons = () => {
    const reasons = [];
    
    // Danger level warnings
    if (token.isHoneypot) reasons.push('TOKEN IS A HONEYPOT - Cannot sell tokens');
    if (token.gpIsBlacklisted && !token.gpIsAntiWhale) reasons.push('Token is blacklisted (not anti-whale)');
    
    // Contract security warnings
    if (!token.gpIsOpenSource) reasons.push('Contract is not open source');
    if (token.gpIsProxy) reasons.push('Contract uses proxy pattern');
    if (token.gpIsMintable) reasons.push('Token is mintable');
    if (token.gpExternalCall) reasons.push('Contract has external calls');
    
    // Trading restrictions warnings
    if (token.gpCannotBuy) reasons.push('Buying is restricted');
    if (token.gpCannotSellAll) reasons.push('Cannot sell all tokens');
    if (token.gpTradingCooldown) reasons.push('Trading cooldown enabled');
    if (token.gpTransferPausable) reasons.push('Transfers can be paused');
    
    // Ownership warnings
    if (token.gpHiddenOwner) reasons.push('Hidden owner detected');
    if (token.gpCanTakeBackOwnership) reasons.push('Ownership can be taken back');
    if (token.gpOwnerChangeBalance) reasons.push('Owner can change balances');
    
    // Tax warnings
    if (token.gpBuyTax > 10) reasons.push(`High buy tax: ${token.gpBuyTax}%`);
    if (token.gpSellTax > 10) reasons.push(`High sell tax: ${token.gpSellTax}%`);
    
    // Anti-whale warnings
    if (token.gpIsAntiWhale && token.gpAntiWhaleModifiable) reasons.push('Modifiable anti-whale mechanism');
    if (token.gpSlippageModifiable) reasons.push('Modifiable slippage settings');
    
    return reasons;
  };

  const warningReasons = getWarningReasons();
  const isDangerousBlacklist = token.gpIsBlacklisted && !token.gpIsAntiWhale;
  const securityLevel = token.isHoneypot || isDangerousBlacklist ? 'danger' : 
                       warningReasons.length > 0 ? 'warning' : 'safe';

  // Helper function to safely convert values to string
  const safeToString = (value: any) => {
    if (value === undefined || value === null) return 'N/A';
    return String(value);
  };

  // Helper function to format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const numValue = Number(value);
    return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function for boolean values
  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return 'N/A';
    return value ? 'Yes' : 'No';
  };

  // Helper function to format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const numValue = Number(value);
    return `${numValue.toFixed(2)}%`;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Helper function to calculate liquidity score
  const calculateLiquidityScore = (liq30: number | undefined): number => {
    if (liq30 === undefined) return 0;
    const numLiq = Number(liq30);
    if (numLiq > 50000) return 25;
    if (numLiq > 25000) return 20;
    if (numLiq > 10000) return 15;
    if (numLiq > 5000) return 10;
    if (numLiq > 1000) return 5;
    return 0;
  };

  // Helper function to calculate market behavior score
  const calculateMarketScore = (totalScans: number | undefined, honeypotFailures: number | undefined): number => {
    if (totalScans === undefined || honeypotFailures === undefined) return 0;
    const numTotal = Number(totalScans);
    const numFailures = Number(honeypotFailures);
    return ((numTotal - numFailures) / Math.max(numTotal, 1)) * 25;
  };

  // Helper function to calculate growth score
  const calculateGrowthScore = (holderCount: number | undefined): number => {
    if (holderCount === undefined) return 0;
    const numHolders = Number(holderCount);
    if (numHolders > 100) return 25;
    if (numHolders > 50) return 20;
    if (numHolders > 25) return 15;
    if (numHolders > 10) return 10;
    if (numHolders > 5) return 5;
    return 0;
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {/* Main Token Info */}
      <div className="col-span-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full w-full p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
        >
          {/* Header with gradient background */}
          <div className="flex items-center justify-between mb-3 bg-gradient-to-r from-gray-50 to-white p-2 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">
              {token.name} ({token.symbol})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium ${securityStatus[securityLevel]} px-2 py-0.5 rounded-full`}>
                {securityLevel.toUpperCase()}
              </span>
              {token.gpIsBlacklisted && (
                <span className={`text-xs font-medium ${token.gpIsAntiWhale ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-red-100 text-red-800 border border-red-200'} flex items-center px-2 py-0.5 rounded-full`}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {token.gpIsAntiWhale ? 'ANTI-WHALE' : 'BLACKLISTED'}
                </span>
              )}
              {/* Token Age from Creation Time */}
              {(() => {
                if (!token.creationTime) return null;
                const creationDate = new Date(parseInt(token.creationTime) * 1000);
                const currentTime = new Date();
                const ageInMinutes = Math.floor((currentTime.getTime() - creationDate.getTime()) / (1000 * 60));
                return (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 mr-1" />
                      {ageInMinutes}m
                    </span>
                    {/* Holder Count */}
                    <span className="text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 flex items-center px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3 mr-1" />
                      {token.gpHolderCount?.toLocaleString('en-US') || '0'}
                    </span>
                    {/* Liquidity */}
                    <span className="text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center px-2 py-0.5 rounded-full">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${token.liq30?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </span>
                    {/* Honeypot Liquidity */}
                    <span className="text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200 flex items-center px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3 mr-1" />
                      ${token.hp_liquidity_amount?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </span>
                  </div>
                );
              })()}
              {/* Token Age Hours Raw */}
              {token.ageHours !== undefined && (
                <span className="text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(token.ageHours)}h {Math.round((token.ageHours % 1) * 60)}m
                </span>
              )}
            </div>
          </div>

          {/* Warning/Danger Reasons Panel */}
          {(securityLevel === 'warning' || securityLevel === 'danger') && (
            <div className={`mb-3 p-2 ${
              securityLevel === 'danger' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-yellow-50 border border-yellow-200'
            } rounded-lg`}>
              <h4 className={`text-xs font-semibold ${
                securityLevel === 'danger' ? 'text-red-800' : 'text-yellow-800'
              } mb-1`}>
                {securityLevel === 'danger' ? 'Danger Reasons:' : 'Warning Reasons:'}
              </h4>
              <ul className={`text-xs ${
                securityLevel === 'danger' ? 'text-red-700' : 'text-yellow-700'
              } space-y-0.5 list-disc pl-4`}>
                {warningReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* API Call IDs */}
          <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded-lg">
            <div>GoPlus API Call ID: {safeToString(token.totalScans)}</div>
            <div>Honeypot API Call ID: {safeToString(token.honeypotFailures)}</div>
            <div>Creation Time: {formatTimestamp(token.creationTime)}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Token Info */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<Info className="w-4 h-4" />} title="Token Info" />
              <Field label="Token Address" value={token.address} truncate />
              <Field label="Pair Address" value={token.pairAddress} truncate />
              <Field label="Token Name" value={token.name} />
              <Field label="Token Symbol" value={token.symbol} />
              <Field label="Decimals" value={token.decimals} />
              <Field label="Total Supply" value={token.totalSupply} />
              <Field label="Total Holders" value={token.gpHolderCount} />
            </div>

            {/* Pair Info */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<Activity className="w-4 h-4" />} title="Pair Info" />
              <Field label="Liquidity" value={formatCurrency(token.liq30)} />
              <Field label="Creation Time" value={token.creationTime} />
              <Field label="Reserves Token0" value={token.reservesToken0} />
              <Field label="Reserves Token1" value={token.reservesToken1} />
              <Field label="Creation Tx" value={token.creationTx} truncate />
            </div>

            {/* Simulation */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<FileText className="w-4 h-4" />} title="Simulation" />
              <Field label="Success" value="Yes" />
              <Field label="Buy Tax" value={formatPercentage(token.buyTax)} />
              <Field label="Sell Tax" value={formatPercentage(token.sellTax)} />
              <Field label="Transfer Tax" value={formatPercentage(token.transferTax)} />
              <Field label="Buy Gas" value={token.buyGas} />
              <Field label="Sell Gas" value={token.sellGas} />
            </div>

            {/* Contract */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<Lock className="w-4 h-4" />} title="Contract" />
              <Field label="Open Source" value={formatBoolean(token.isOpenSource)} />
              <Field label="Is Proxy" value={formatBoolean(token.isProxy)} />
              <Field label="Has Proxy Calls" value={formatBoolean(token.hasProxyCalls)} />
              <Field label="Is Mintable" value={formatBoolean(token.isMintable)} />
              <Field label="Can Be Minted" value={formatBoolean(token.canBeMinted)} />
            </div>

            {/* Honeypot Analysis */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<Shield className="w-4 h-4" />} title="Honeypot Analysis" />
              <Field label="Is Honeypot" value={formatBoolean(token.isHoneypot)} />
              {token.honeypotReason && (
                <Field label="Honeypot Reason" value={token.honeypotReason} />
              )}
              <Field label="Risk Level" value={token.riskLevel} />
              <Field label="Risk Type" value={token.riskType} />
            </div>

            {/* Holder Analysis */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <SectionHeader icon={<Users className="w-4 h-4" />} title="Holder Analysis" />
              <Field label="Total Holders" value={token.gpHolderCount} />
              <Field label="Successful Txs" value={token.totalScans} />
              <Field label="Failed Txs" value={token.honeypotFailures} />
              <Field label="Average Tax" value={formatPercentage(token.gpBuyTax)} />
              <Field label="Average Gas" value={token.buyGas} />
              <Field label="Highest Tax" value={formatPercentage(Math.max(token.gpBuyTax || 0, token.gpSellTax || 0))} />
              <Field label="High Tax Wallets" value="0" />
              <Field label="Snipers Failed" value="0" />
              <Field label="Snipers Success" value="0" />
            </div>

            {/* GoPlus Security Analysis */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 col-span-2">
              <SectionHeader icon={<Shield className="w-4 h-4" />} title="GoPlus Security Analysis" />
              <div className="grid grid-cols-3 gap-3">
                {/* Column 1: Security Status & Contract */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Security Status</h5>
                    <Field label="Is Honeypot" value={formatBoolean(token.isHoneypot)} />
                    <Field label="Honeypot Same Creator" value={formatBoolean(token.gpHoneypotWithSameCreator)} />
                    <Field label="Blacklisted" value={formatBoolean(token.gpIsBlacklisted)} />
                    <Field label="Whitelisted" value={formatBoolean(token.gpIsWhitelisted)} />
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Contract Security</h5>
                    <Field label="Open Source" value={formatBoolean(token.gpIsOpenSource)} />
                    <Field label="Proxy" value={formatBoolean(token.gpIsProxy)} />
                    <Field label="Mintable" value={formatBoolean(token.gpIsMintable)} />
                    <Field label="External Calls" value={formatBoolean(token.gpExternalCall)} />
                    <Field label="Can Self-Destruct" value={formatBoolean(token.gpSelfDestruct)} />
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Taxes</h5>
                    <Field label="Buy Tax" value={formatPercentage(token.gpBuyTax)} />
                    <Field label="Sell Tax" value={formatPercentage(token.gpSellTax)} />
                  </div>
                </div>

                {/* Column 2: Ownership & Trading */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Ownership</h5>
                    <Field label="Hidden Owner" value={formatBoolean(token.gpHiddenOwner)} />
                    <Field label="Can Take Back Ownership" value={formatBoolean(token.gpCanTakeBackOwnership)} />
                    <Field label="Owner Change Balance" value={formatBoolean(token.gpOwnerChangeBalance)} />
                    <Field label="Owner Address" value={token.gpOwnerAddress} truncate />
                    <Field label="Owner Balance" value={token.gpOwnerBalance} />
                    <Field label="Owner Percent" value={formatPercentage(token.gpOwnerPercent)} />
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Trading Restrictions</h5>
                    <Field label="Cannot Buy" value={formatBoolean(token.gpCannotBuy)} />
                    <Field label="Cannot Sell All" value={formatBoolean(token.gpCannotSellAll)} />
                    <Field label="Trading Cooldown" value={formatBoolean(token.gpTradingCooldown)} />
                    <Field label="Transfer Pausable" value={formatBoolean(token.gpTransferPausable)} />
                  </div>
                </div>

                {/* Column 3: Holders & Anti-Whale */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Holders Info</h5>
                    <Field label="Total Holders" value={token.gpHolderCount} />
                    <Field label="LP Holders" value={token.gpLpHolderCount} />
                    <Field label="Creator Balance" value={token.gpCreatorBalance} />
                    <Field label="Creator %" value={formatPercentage(token.gpCreatorPercent)} />
                    <Field label="LP Total Supply" value={token.gpLpTotalSupply} />
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Anti-Whale Measures</h5>
                    <Field label="Anti-Whale" value={formatBoolean(token.gpIsAntiWhale)} />
                    <Field label="Anti-Whale Modifiable" value={formatBoolean(token.gpAntiWhaleModifiable)} />
                    <Field label="Slippage Modifiable" value={formatBoolean(token.gpSlippageModifiable)} />
                    <Field label="Personal Slippage Modifiable" value={formatBoolean(token.gpPersonalSlippageModifiable)} />
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-gray-700 border-b pb-1">Liquidity</h5>
                    {token.gpDexInfo?.map((dex, index) => (
                      <Field key={index} label={dex.name} value={`$${dex.liquidity}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Information */}
          <div className="mt-3 text-xs text-gray-600">
            Scan Timestamp: {token.scanTimestamp || 'N/A'}
          </div>
        </motion.div>
      </div>
      
      {/* Charts Section */}
      <div className="col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full w-full p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 space-y-2"
        >
          {/* Chart Debug Info */}
          <div className="text-xs p-1.5 bg-gray-50 rounded border border-gray-100">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500">Table</span>
                <span className="truncate text-gray-700">{token.address}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500">Records</span>
                <span className="text-gray-700">{token.gpHolderCount || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500">Highest Liquidity</span>
                <span className="text-gray-700">{formatCurrency(token.liq30)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-500">Lowest Liquidity</span>
                <span className="text-gray-700">{formatCurrency(token.liq30)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-medium text-gray-500">Time Range</span>
                <span className="text-gray-700 block truncate">
                  {formatTimestamp(token.creationTime)} to {formatTimestamp(token.scanTimestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-2">
            {/* Liquidity History */}
            <div className="bg-white rounded border border-gray-100 p-1.5">
              <div className="text-xs font-medium text-gray-700 mb-1">Liquidity History</div>
              <TokenLiquidityChart token={token} />
            </div>

            {/* Holder History */}
            <div className="bg-white rounded border border-gray-100 p-1.5">
              <div className="text-xs font-medium text-gray-700 mb-1">Holder History</div>
              <div className="h-[150px] flex items-center justify-center text-xs text-gray-500">
                No holder history data available
              </div>
            </div>

            {/* Current Holder Distribution */}
            <div className="bg-white rounded border border-gray-100 p-1.5">
              <div className="text-xs font-medium text-gray-700 mb-1">Current Holder Distribution</div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-blue-600 text-lg font-semibold">{token.gpHolderCount || 0}</div>
                  <div className="text-[10px] text-gray-500">Total Holders</div>
                </div>
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-green-600 text-lg font-semibold">{token.gpLpHolderCount || 0}</div>
                  <div className="text-[10px] text-gray-500">LP Holders</div>
                </div>
                <div className="bg-gray-50 rounded p-1">
                  <div className="text-purple-600 text-lg font-semibold">{formatPercentage(token.gpOwnerPercent || 0)}</div>
                  <div className="text-[10px] text-gray-500">Owner %</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Analysis Models Section */}
          <div className="bg-white rounded-lg shadow-sm flex-grow">
            <SectionHeader icon={<Network className="w-3 h-3" />} title="Token Analysis Models" />
            
            {/* Individual Models Grid */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Market Behavior Model */}
              <div className="bg-white p-1.5 rounded border border-gray-100">
                <h5 className="font-medium text-xs text-gray-700 mb-1">Market Behavior Model</h5>
                {(() => {
                  const marketScore = calculateMarketScore(token.totalScans, token.honeypotFailures);
                  return (
                    <div className="text-xs">
                      <div>Score: {marketScore.toFixed(1)}%</div>
                      <div>Total Transactions: {token.totalScans || 0}</div>
                      <div>Failed Transactions: {token.honeypotFailures || 0}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Smart Contract Security Model */}
              <div className="bg-white p-1.5 rounded border border-gray-100">
                <h5 className="font-medium text-xs text-gray-700 mb-1">Smart Contract Security Model</h5>
                {(() => {
                  const securityScore = token.gpIsOpenSource ? 25 : 0;
                  return (
                    <div className="text-xs">
                      <div>Score: {securityScore.toFixed(1)}%</div>
                      <div>Open Source: {formatBoolean(token.gpIsOpenSource)}</div>
                      <div>Verified: {formatBoolean(!token.gpIsProxy)}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Liquidity Risk Model */}
              <div className="bg-white p-1.5 rounded border border-gray-100">
                <h5 className="font-medium text-xs text-gray-700 mb-1">Liquidity Risk Model</h5>
                {(() => {
                  const liquidityScore = calculateLiquidityScore(token.liq30);
                  return (
                    <div className="text-xs">
                      <div>Score: {liquidityScore.toFixed(1)}%</div>
                      <div>Liquidity: {formatCurrency(token.liq30)}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Growth Momentum Model */}
              <div className="bg-white p-1.5 rounded border border-gray-100">
                <h5 className="font-medium text-xs text-gray-700 mb-1">Growth Momentum Model</h5>
                {(() => {
                  const growthScore = calculateGrowthScore(token.gpHolderCount);
                  return (
                    <div className="text-xs">
                      <div>Score: {growthScore.toFixed(1)}%</div>
                      <div>Holders: {token.gpHolderCount || 0}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Combined Analysis Model - Prominent Box */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded border border-gray-100 shadow-sm">
              <h5 className="font-semibold text-sm text-gray-800 mb-2">Combined Analysis Model</h5>
              {(() => {
                // Calculate individual model scores
                const marketScore = calculateMarketScore(token.totalScans, token.honeypotFailures);
                const securityScore = token.gpIsOpenSource ? 25 : 0;
                const liquidityScore = calculateLiquidityScore(token.liq30);
                const growthScore = calculateGrowthScore(token.gpHolderCount);

                // Calculate weighted scores
                const marketWeighted = marketScore * 0.15;
                const securityWeighted = securityScore * 0.40;
                const liquidityWeighted = liquidityScore * 0.25;
                const growthWeighted = growthScore * 0.20;

                // Calculate total score
                const totalScore = marketWeighted + securityWeighted + liquidityWeighted + growthWeighted;

                return (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-gray-800 pb-1 border-b border-gray-100">
                      Combined Score: {totalScore.toFixed(1)}%
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-white/50 p-1 rounded">
                          <span className="text-xs text-blue-600">Market (15%):</span>
                          <span className="font-medium">{marketWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-1 rounded">
                          <span className="text-xs text-green-600">Security (40%):</span>
                          <span className="font-medium">{securityWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-1 rounded">
                          <span className="text-xs text-purple-600">Liquidity (25%):</span>
                          <span className="font-medium">{liquidityWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-1 rounded">
                          <span className="text-xs text-orange-600">Growth (20%):</span>
                          <span className="font-medium">{growthWeighted.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded text-xs space-y-0.5">
                        <div className="font-medium text-gray-700 mb-1">Score Breakdown:</div>
                        <div className="text-blue-600">Market: {marketScore.toFixed(1)}% × 0.15</div>
                        <div className="text-green-600">Security: {securityScore.toFixed(1)}% × 0.40</div>
                        <div className="text-purple-600">Liquidity: {liquidityScore.toFixed(1)}% × 0.25</div>
                        <div className="text-orange-600">Growth: {growthScore.toFixed(1)}% × 0.20</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
