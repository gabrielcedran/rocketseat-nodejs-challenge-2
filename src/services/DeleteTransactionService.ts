import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(uuid: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const result = await transactionsRepository.delete(uuid);
    if (!result || !result.affected || result.affected <= 0) {
      throw new AppError('Transaction not found', 400);
    }
  }
}

export default DeleteTransactionService;
