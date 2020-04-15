import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface RequestDTO {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category_id: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category_id,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // fixme validate stuff

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
