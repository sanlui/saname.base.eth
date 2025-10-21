
export interface Token {
  name: string;
  symbol: string;
  creator: string;
  timestamp: string;
  address: string;
}

export interface Creator {
  rank: number;
  address: string;
  tokensCreated: number;
}
