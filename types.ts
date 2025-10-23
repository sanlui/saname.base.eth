export interface Token {
  name: string;
  symbol: string;
  creator: string;
  address: string;
  supply: string;
  timestamp?: number;
  txHash?: string;
  decimals?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}