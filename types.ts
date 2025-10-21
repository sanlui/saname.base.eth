
export interface Token {
  name: string;
  symbol: string;
  creator: string;
  address: string;
  supply: string;
}

export interface Creator {
  rank: number;
  address: string;
  totalSupply: string;
  badge: string;
}

// EIP-6963 Types
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (request: { method: string, params?: Array<any> }, callback: (error: Error | null, response: any) => void) => void;
  send?: (request: { method: string, params?: Array<any> }, callback: (error: Error | null, response: any) => void) => void;
  request: (request: { method: string, params?: Array<any> }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail;
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
  }
}
