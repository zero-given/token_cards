import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Info, Activity, FileText, Lock, Users, AlertTriangle, DollarSign, Network } from 'lucide-react';
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
  <div className="flex items-center space-x-2 mb-4 border-b border-gray-200 pb-2">
    {icon}
    <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
  </div>
);

const Field: React.FC<{ label: string; value: any; truncate?: boolean }> = ({ label, value, truncate }) => (
  <div className="mb-2">
    <span className="text-sm font-medium text-gray-600">{label}: </span>
    <span className={`text-sm text-gray-800 ${truncate ? 'truncate block' : ''}`}>
      {value === undefined || value === null ? 'N/A' : value.toString()}
    </span>
  </div>
);

export const TokenEventCard: React.FC<TokenEventCardProps> = ({ token }) => {
  const getWarningReasons = () => {
    const reasons = [];
    
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
  const securityLevel = token.isHoneypot ? 'danger' : 
                       warningReasons.length > 0 ? 'warning' : 'safe';

  // Helper function to safely convert values to string
  const safeToString = (value: any) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toString();
  };

  // Helper function to format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function for boolean values
  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return 'N/A';
    return value ? 'Yes' : 'No';
  };

  // Helper function to format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Main Token Info */}
      <div className="col-span-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full w-full p-6 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
        >
          {/* Header with gradient background */}
          <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              {token.name} ({token.symbol})
            </h3>
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium ${securityStatus[securityLevel]} px-3 py-1 rounded-full`}>
                {securityLevel.toUpperCase()}
              </span>
              {token.gpIsBlacklisted && (
                <span className="text-sm font-medium bg-red-100 text-red-800 border border-red-200 flex items-center px-3 py-1 rounded-full">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  BLACKLISTED
                </span>
              )}
            </div>
          </div>

          {/* Warning Reasons Panel - Only show for warning status */}
          {securityLevel === 'warning' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Warning Reasons:</h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-4">
                {warningReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* API Call IDs */}
          <div className="text-sm text-gray-600 mb-6 p-3 bg-gray-50 rounded-lg">
            <div>GoPlus API Call ID: {safeToString(token.totalScans)}</div>
            <div>Honeypot API Call ID: {safeToString(token.honeypotFailures)}</div>
            <div>Creation Time: {formatTimestamp(token.creationTime)}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Token Info */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<Info className="w-5 h-5" />} title="Token Info" />
              <Field label="Token Address" value={token.address} truncate />
              <Field label="Pair Address" value={token.pairAddress} truncate />
              <Field label="Token Name" value={token.name} />
              <Field label="Token Symbol" value={token.symbol} />
              <Field label="Decimals" value={token.decimals} />
              <Field label="Total Supply" value={token.totalSupply} />
              <Field label="Total Holders" value={token.gpHolderCount} />
            </div>

            {/* Pair Info */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<Activity className="w-5 h-5" />} title="Pair Info" />
              <Field label="Liquidity" value={formatCurrency(token.liq30)} />
              <Field label="Creation Time" value={token.creationTime} />
              <Field label="Reserves Token0" value={token.reservesToken0} />
              <Field label="Reserves Token1" value={token.reservesToken1} />
              <Field label="Creation Tx" value={token.creationTx} truncate />
            </div>

            {/* Simulation */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<FileText className="w-5 h-5" />} title="Simulation" />
              <Field label="Success" value="Yes" />
              <Field label="Buy Tax" value={formatPercentage(token.buyTax)} />
              <Field label="Sell Tax" value={formatPercentage(token.sellTax)} />
              <Field label="Transfer Tax" value={formatPercentage(token.transferTax)} />
              <Field label="Buy Gas" value={token.buyGas} />
              <Field label="Sell Gas" value={token.sellGas} />
            </div>

            {/* Contract */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<Lock className="w-5 h-5" />} title="Contract" />
              <Field label="Open Source" value={formatBoolean(token.isOpenSource)} />
              <Field label="Is Proxy" value={formatBoolean(token.isProxy)} />
              <Field label="Has Proxy Calls" value={formatBoolean(token.hasProxyCalls)} />
              <Field label="Is Mintable" value={formatBoolean(token.isMintable)} />
              <Field label="Can Be Minted" value={formatBoolean(token.canBeMinted)} />
            </div>

            {/* Honeypot Analysis */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<Shield className="w-5 h-5" />} title="Honeypot Analysis" />
              <Field label="Is Honeypot" value={formatBoolean(token.isHoneypot)} />
              {token.honeypotReason && (
                <Field label="Honeypot Reason" value={token.honeypotReason} />
              )}
              <Field label="Risk Level" value={token.riskLevel} />
              <Field label="Risk Type" value={token.riskType} />
            </div>

            {/* Holder Analysis */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <SectionHeader icon={<Users className="w-5 h-5" />} title="Holder Analysis" />
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
            <div className="bg-white p-4 rounded-lg shadow-lg col-span-2">
              <SectionHeader icon={<Shield className="w-5 h-5" />} title="GoPlus Security Analysis" />
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1: Security Status & Contract */}
                <div className="space-y-6">
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
                <div className="space-y-6">
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
                <div className="space-y-6">
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
          <div className="mt-6 text-sm text-gray-600">
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
          className="h-full w-full p-6 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 space-y-4"
        >
          <TokenLiquidityChart token={token} />
          
          {/* Additional Analysis Box */}
          <div className="bg-white p-4 rounded-lg shadow-lg flex-grow">
            <SectionHeader icon={<Network className="w-5 h-5" />} title="Token Analysis Models" />
            
            {/* Individual Models Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Market Behavior Model */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Market Behavior Model</h5>
                {(() => {
                  const txSuccessScore = ((token.totalScans - token.honeypotFailures) / Math.max(token.totalScans, 1)) * 25;
                  const gasScore = token.buyGas && token.sellGas ? 
                    (Math.abs(token.buyGas - token.sellGas) < 50000 ? 25 : 0) : 0;
                  const distributionScore = token.gpHolderCount > 100 ? 25 : 
                    token.gpHolderCount > 50 ? 15 : 
                    token.gpHolderCount > 20 ? 10 : 5;
                  const patternScore = token.gpBuyTax === token.gpSellTax ? 25 : 
                    Math.abs(token.gpBuyTax - token.gpSellTax) < 2 ? 15 : 5;
                  const totalScore = txSuccessScore + gasScore + distributionScore + patternScore;
                  
                  return (
                    <div className="text-base font-bold text-blue-600">
                      Score: {totalScore.toFixed(1)}%
                    </div>
                  );
                })()}
              </div>

              {/* Smart Contract Security Model */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Smart Contract Security Model</h5>
                {(() => {
                  const verificationScore = token.gpIsOpenSource ? 25 : 0;
                  const ownershipScore = (!token.gpHiddenOwner && !token.gpCanTakeBackOwnership) ? 25 : 0;
                  const mintingScore = !token.gpIsMintable ? 25 : 0;
                  const externalScore = !token.gpExternalCall ? 25 : 0;
                  const totalScore = verificationScore + ownershipScore + mintingScore + externalScore;
                  
                  return (
                    <div className="text-base font-bold text-green-600">
                      Score: {totalScore.toFixed(1)}%
                    </div>
                  );
                })()}
              </div>

              {/* Liquidity Risk Model */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Liquidity Risk Model</h5>
                {(() => {
                  const liquidityScore = token.liq30 > 50000 ? 25 :
                    token.liq30 > 10000 ? 20 :
                    token.liq30 > 5000 ? 15 :
                    token.liq30 > 1000 ? 10 : 5;
                  const lpHolderScore = token.gpLpHolderCount > 2 ? 25 :
                    token.gpLpHolderCount === 2 ? 15 : 5;
                  const sellImpactScore = !token.gpCannotSellAll ? 25 : 0;
                  const lockScore = token.gpLpHolderCount > 1 ? 25 : 0;
                  const totalScore = liquidityScore + lpHolderScore + sellImpactScore + lockScore;
                  
                  return (
                    <div className="text-base font-bold text-purple-600">
                      Score: {totalScore.toFixed(1)}%
                    </div>
                  );
                })()}
              </div>

              {/* Growth Momentum Model */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Growth Momentum Model</h5>
                {(() => {
                  const holderScore = token.gpHolderCount > 100 ? 25 :
                    token.gpHolderCount > 50 ? 20 :
                    token.gpHolderCount > 20 ? 15 : 10;
                  const liquidityTrendScore = token.liq30 > 10000 ? 25 :
                    token.liq30 > 5000 ? 20 :
                    token.liq30 > 1000 ? 15 : 10;
                  const volumeScore = token.totalScans > 100 ? 25 :
                    token.totalScans > 50 ? 20 :
                    token.totalScans > 20 ? 15 : 10;
                  const distributionScore = token.gpOwnerPercent < 5 ? 25 :
                    token.gpOwnerPercent < 10 ? 20 :
                    token.gpOwnerPercent < 20 ? 15 : 5;
                  const totalScore = holderScore + liquidityTrendScore + volumeScore + distributionScore;
                  
                  return (
                    <div className="text-base font-bold text-orange-600">
                      Score: {totalScore.toFixed(1)}%
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Combined Analysis Model - Prominent Box */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200 shadow-sm">
              <h5 className="font-semibold text-lg text-gray-800 mb-4">Combined Analysis Model</h5>
              {(() => {
                // Get individual model scores
                const marketScore = ((token.totalScans - token.honeypotFailures) / Math.max(token.totalScans, 1)) * 25 +
                  (token.buyGas && token.sellGas ? (Math.abs(token.buyGas - token.sellGas) < 50000 ? 25 : 0) : 0) +
                  (token.gpHolderCount > 100 ? 25 : token.gpHolderCount > 50 ? 15 : token.gpHolderCount > 20 ? 10 : 5) +
                  (token.gpBuyTax === token.gpSellTax ? 25 : Math.abs(token.gpBuyTax - token.gpSellTax) < 2 ? 15 : 5);

                const securityScore = (token.gpIsOpenSource ? 25 : 0) +
                  (!token.gpHiddenOwner && !token.gpCanTakeBackOwnership ? 25 : 0) +
                  (!token.gpIsMintable ? 25 : 0) +
                  (!token.gpExternalCall ? 25 : 0);

                const liquidityScore = (token.liq30 > 50000 ? 25 : token.liq30 > 10000 ? 20 : token.liq30 > 5000 ? 15 : token.liq30 > 1000 ? 10 : 5) +
                  (token.gpLpHolderCount > 2 ? 25 : token.gpLpHolderCount === 2 ? 15 : 5) +
                  (!token.gpCannotSellAll ? 25 : 0) +
                  (token.gpLpHolderCount > 1 ? 25 : 0);

                const growthScore = (token.gpHolderCount > 100 ? 25 : token.gpHolderCount > 50 ? 20 : token.gpHolderCount > 20 ? 15 : 10) +
                  (token.liq30 > 10000 ? 25 : token.liq30 > 5000 ? 20 : token.liq30 > 1000 ? 15 : 10) +
                  (token.totalScans > 100 ? 25 : token.totalScans > 50 ? 20 : token.totalScans > 20 ? 15 : 10) +
                  (token.gpOwnerPercent < 5 ? 25 : token.gpOwnerPercent < 10 ? 20 : token.gpOwnerPercent < 20 ? 15 : 5);

                // Calculate weighted scores
                const marketWeighted = (marketScore * 0.15);
                const securityWeighted = (securityScore * 0.40);
                const liquidityWeighted = (liquidityScore * 0.25);
                const growthWeighted = (growthScore * 0.20);

                // Calculate total score
                const totalScore = marketWeighted + securityWeighted + liquidityWeighted + growthWeighted;

                return (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-gray-800 pb-4 border-b border-gray-200">
                      Combined Score: {totalScore.toFixed(1)}%
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                          <span className="text-sm text-blue-600">Market Behavior (15%):</span>
                          <span className="font-medium">{marketWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                          <span className="text-sm text-green-600">Contract Security (40%):</span>
                          <span className="font-medium">{securityWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                          <span className="text-sm text-purple-600">Liquidity Risk (25%):</span>
                          <span className="font-medium">{liquidityWeighted.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                          <span className="text-sm text-orange-600">Growth Momentum (20%):</span>
                          <span className="font-medium">{growthWeighted.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg text-sm space-y-2">
                        <div className="font-medium text-gray-700 mb-2">Score Breakdown:</div>
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
