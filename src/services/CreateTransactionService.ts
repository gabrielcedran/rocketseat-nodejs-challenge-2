import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface RequestDTO {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const errors = [];
    if (!title) {
      errors.push('Title is mandatory.');
    }

    if (!type) {
      errors.push('Type is mandatory.');
    } else if (type !== 'income' && type !== 'outcome') {
      errors.push('Type is invalid.');
    }

    if (!value) {
      errors.push('Value is mandatory.');
    } else if (value <= 0) {
      errors.push('Value is invalid.');
    }

    if (!category) {
      errors.push('Category is mandatory.');
    }

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (balance.total < value) {
        errors.push('There is no funds available for this transaction.');
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join('\n'), 400);
    }

    let categoryEntity = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryEntity) {
      categoryEntity = categoriesRepository.create({ title: category });
      await categoriesRepository.save(categoryEntity);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryEntity.id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
