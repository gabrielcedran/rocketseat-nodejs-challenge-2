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
      .select(
        "coalesce(sum(case when(type = 'income') then value else 0 end), 0)",
        'income',
      )
      .addSelect(
        "coalesce(sum(case when(type = 'outcome') then value else 0 end), 0)",
        'outcome',
      )
      .addSelect(
        "coalesce(sum(case when(type = 'income') then value else value * -1 end), 0)",
        'total',
      )
      .getRawOne();

    return {
      income: Number(incomeAndOutcome.income),
      outcome: Number(incomeAndOutcome.outcome),
      total: Number(incomeAndOutcome.total),
    };
  }
}

export default TransactionsRepository;
