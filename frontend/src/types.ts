export interface Token {
  // Basic token info
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  ageHours: number;
  
  // Pair info
  pairAddress: string;
  reservesToken0: string;
  reservesToken1: string;
  creationTx: string;
  creationTime: string;
  
  // Honeypot analysis
  isHoneypot: boolean;
  honeypotReason: string;
  riskLevel: string;
  riskType: string;
  hp_liquidity_amount: number;
  
  // Contract info
  isOpenSource: boolean;
  isProxy: boolean;
  isMintable: boolean;
  canBeMinted: boolean;
  hasProxyCalls: boolean;
  
  // Tax and gas info
  buyTax: number;
  sellTax: number;
  transferTax: number;
  buyGas: number;
  sellGas: number;
  
  // Ownership info
  ownerAddress: string;
  creatorAddress: string;
  deployerAddress: string;
  
  // GoPlus security info
  gpIsOpenSource: boolean;
  gpIsProxy: boolean;
  gpIsMintable: boolean;
  gpOwnerAddress: string;
  gpCreatorAddress: string;
  gpCanTakeBackOwnership: boolean;
  gpOwnerChangeBalance: boolean;
  gpHiddenOwner: boolean;
  gpSelfDestruct: boolean;
  gpExternalCall: boolean;
  gpBuyTax: number;
  gpSellTax: number;
  gpIsAntiWhale: boolean;
  gpAntiWhaleModifiable: boolean;
  gpCannotBuy: boolean;
  gpCannotSellAll: boolean;
  gpSlippageModifiable: boolean;
  gpPersonalSlippageModifiable: boolean;
  gpTradingCooldown: boolean;
  gpIsBlacklisted: boolean;
  gpIsWhitelisted: boolean;
  gpIsInDex: boolean;
  gpTransferPausable: boolean;
  gpCanBeMinted: boolean;
  gpTotalSupply: string;
  gpHolderCount: number;
  gpOwnerPercent: number;
  gpOwnerBalance: string;
  gpCreatorPercent: number;
  gpCreatorBalance: string;
  gpLpHolderCount: number;
  gpLpTotalSupply: string;
  gpIsTrueToken: boolean;
  gpIsAirdropScam: boolean;
  gpHoneypotWithSameCreator: boolean;
  gpFakeToken: boolean;
  
  // Holders and LP info
  gpHolders: {
    address: string;
    tag: string;
    is_contract: boolean;
    balance: string;
    percent: string;
    is_locked: boolean;
  }[];
  
  gpLpHolders: {
    address: string;
    tag: string;
    value: any;
    is_contract: boolean;
    balance: string;
    percent: string;
    NFT_list: any;
    is_locked: boolean;
    locked_detail?: {
      amount: string;
      end_time: string;
      opt_time: string;
    }[];
  }[];
  
  // DEX info
  gpDexInfo: {
    liquidity_type: string;
    name: string;
    liquidity: string;
    pair: string;
  }[];
  
  // Additional metadata
  totalScans: number;
  honeypotFailures: number;
  lastError: string;
  status: string;
  
  // Liquidity history
  liq10?: number;
  liq20?: number;
  liq30?: number;
  liq40?: number;
  liq50?: number;
  liq60?: number;
  liq70?: number;
  liq80?: number;
  liq90?: number;
  liq100?: number;
  liq110?: number;
  liq120?: number;
  liq130?: number;
  liq140?: number;
  liq150?: number;
  liq160?: number;
  liq170?: number;
  liq180?: number;
  liq190?: number;
  liq200?: number;
  
  // Scan info
  scanTimestamp: string;
  
  token_address: string;
  holdersChanged: boolean;
  liquidityChanged: boolean;
  safetyScore: number;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      // ... other env variables ...
    }
  }
}
