import React, { useMemo } from 'react';

declare const useWalletBalances: () => WalletBalance[];
declare const usePrices: () => Record<string, number>; 
declare const WalletRow: React.FC<{
  className?: string;
  key: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}>;

// added blockchain prop to fix TS errors
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; 
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
}


interface Props extends BoxProps {}


// pulled this out of the component so it doesn't get recreated on every render
const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100;
    case 'Ethereum':
      return 50;
    case 'Arbitrum':
      return 30;
    case 'Zilliqa':
    case 'Neo': 
      return 20;
    default:
      return -99;
  }
};

const WalletPage: React.FC<Props> = (props: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);
        
        // fixed undefined 'lhsPriority' bug here
        // also assuming we want to show wallets that actually have money, so flipped to > 0
        return balancePriority > -99 && balance.amount > 0;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        
        // cleaner sort
        return rightPriority - leftPriority;
      });
  }, [balances]); // removed 'prices' from deps, it wasn't even being used here

  // skipped the redundant 'formattedBalances' map since it wasn't being used properly anyway.
  // just formatting the amount directly when rendering the rows now.
  const rows = sortedBalances.map((balance: WalletBalance) => {
    const usdValue = (prices[balance.currency] || 0) * balance.amount;
    
    return (
      <WalletRow 
        // ASSUMPTION: Assuming 'currency' is unique per wallet list. 
        // In a real app with multi-chain identical currencies (e.g., USDT on ETH and Arbitrum), 
        // we should use a unique 'balance.id' or composite key like `${balance.blockchain}-${balance.currency}`
        key={balance.currency} // don't use index as key, swapped to currency
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.amount.toFixed()}
      />
    );
  });

  return (
    <div {...props}>
      {rows}
    </div>
  );
}

export default WalletPage;