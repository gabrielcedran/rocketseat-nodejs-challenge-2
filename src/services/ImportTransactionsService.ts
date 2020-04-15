import fs from 'fs';
import path from 'path';
import csvtojson from 'csvtojson';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface ParsedTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const filePath = path.resolve(uploadConfig.destinationFolder, filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError('Invalid file content', 500);
    }

    const parsedTransactions = (await csvtojson().fromFile(
      filePath,
    )) as ParsedTransaction[];

    await fs.promises.unlink(filePath);

    const createTransactionsService = new CreateTransactionService();

    const transactions = Promise.all(
      parsedTransactions.map(async parsedTransaction =>
        createTransactionsService.execute(parsedTransaction),
      ),
    );
    return transactions;
  }
}

export default ImportTransactionsService;
