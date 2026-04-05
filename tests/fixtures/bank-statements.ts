// Synthetic bank statement extraction outputs for testing.
// All values are fictional. No real financial data.

export interface BankStatementFixture {
  name: string;
  bank: 'SBI' | 'HDFC' | 'ICICI';
  data: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    statementPeriodFrom: string;
    statementPeriodTo: string;
    closingBalance: number;
    closingBalanceCurrency: string;
    averageMonthlyBalance: number;
    salaryDeposits: Array<{ date: string; amount: number; description: string }>;
  };
}

export const BANK_STATEMENT_FIXTURES: BankStatementFixture[] = [
  {
    name: 'SBI — Strong applicant (well above threshold)',
    bank: 'SBI',
    data: {
      accountHolder: 'RAHUL KUMAR',
      accountNumber: 'XXXXXXXX1234',
      bankName: 'State Bank of India',
      statementPeriodFrom: '2026-01-01',
      statementPeriodTo: '2026-03-31',
      closingBalance: 485000,
      closingBalanceCurrency: 'INR',
      averageMonthlyBalance: 420000,
      salaryDeposits: [
        { date: '2026-01-28', amount: 95000, description: 'SALARY JAN 2026' },
        { date: '2026-02-28', amount: 95000, description: 'SALARY FEB 2026' },
        { date: '2026-03-28', amount: 95000, description: 'SALARY MAR 2026' },
      ],
    },
  },
  {
    name: 'HDFC — First-time traveler (adequate balance)',
    bank: 'HDFC',
    data: {
      accountHolder: 'PRIYA SINGH',
      accountNumber: 'XXXXXXXX5678',
      bankName: 'HDFC Bank',
      statementPeriodFrom: '2026-01-01',
      statementPeriodTo: '2026-03-31',
      closingBalance: 180000,
      closingBalanceCurrency: 'INR',
      averageMonthlyBalance: 155000,
      salaryDeposits: [
        { date: '2026-01-31', amount: 55000, description: 'SAL CR JAN26' },
        { date: '2026-02-28', amount: 55000, description: 'SAL CR FEB26' },
        { date: '2026-03-31', amount: 55000, description: 'SAL CR MAR26' },
      ],
    },
  },
  {
    name: 'ICICI — Risky applicant (below threshold for 2-week trip)',
    bank: 'ICICI',
    data: {
      accountHolder: 'SURESH VENKATARAMAN',
      accountNumber: 'XXXXXXXX9012',
      bankName: 'ICICI Bank',
      statementPeriodFrom: '2026-01-01',
      statementPeriodTo: '2026-03-31',
      closingBalance: 45000, // Below 50000/week threshold
      closingBalanceCurrency: 'INR',
      averageMonthlyBalance: 38000,
      salaryDeposits: [
        { date: '2026-01-15', amount: 30000, description: 'CASH DEPOSIT' }, // Irregular — not a salary
        { date: '2026-03-20', amount: 30000, description: 'NEFT TRANSFER' }, // No Feb deposit
      ],
    },
  },
];
