import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomeAndOutcome = await this.createQueryBuilder()
      .select("sum(case when(type = 'income') then value else 0 end)", 'income')
      .addSelect(
        "sum(case when(type = 'outcome') then value else 0 end)",
        'outcome',
      )
      .addSelect(
        "sum(case when(type = 'income') then value else value * -1 end)",
        'total',
      )
      .getRawOne();

    return {
      income: incomeAndOutcome.income,
      outcome: incomeAndOutcome.outcome,
      total: incomeAndOutcome.total,
    };
  }
}

export default TransactionsRepository;
