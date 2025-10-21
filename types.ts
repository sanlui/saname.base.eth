
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
  tokensCreated: number;
}
