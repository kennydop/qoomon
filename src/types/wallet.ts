export type WalletMode = 'paper' | 'live';

export interface BalanceInfo {
  paper: number;
  live: number;
}

export interface TransactionDisplay {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  icon: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  mode: WalletMode;
}
