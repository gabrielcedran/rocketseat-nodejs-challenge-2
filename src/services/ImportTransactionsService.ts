import fs from 'fs';
import path from 'path';
import csvtojson from 'csvtojson';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

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

    const categoryTitles = this.obtainUniqueCategoriesFromParsedTransaction(
      parsedTransactions,
    );

    const categoryIdsByTitle = await this.prepareCategoryIdsByTitle(
      categoryTitles,
    );

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = parsedTransactions.map(parsedTransaction => {
      return transactionsRepository.create({
        title: parsedTransaction.title,
        type: parsedTransaction.type,
        value: parsedTransaction.value,
        category_id: categoryIdsByTitle.get(parsedTransaction.category),
      });
    });
    await transactionsRepository.save(transactions);
    return transactions;
  }

  private obtainUniqueCategoriesFromParsedTransaction(
    transactions: ParsedTransaction[],
  ): string[] {
    return Array.from(
      new Set<string>(transactions.map(transaction => transaction.category)),
    );
  }

  private async prepareCategoryIdsByTitle(
    categoryTitles: string[],
  ): Promise<Map<string, string>> {
    const categoryEntities = await this.prepareCategoryEntities(categoryTitles);

    const categoryIdsByTitle = categoryEntities.reduce((map, category) => {
      map.set(category.title, category.id);
      return map;
    }, new Map<string, string>());

    return categoryIdsByTitle;
  }

  private async prepareCategoryEntities(
    categoryTitles: string[],
  ): Promise<Category[]> {
    const categoriesRepository = getRepository(Category);

    const categoryEntities = await Promise.all(
      categoryTitles.map(async category => {
        let categoryEntity = await categoriesRepository.findOne({
          where: { title: category },
        });

        if (!categoryEntity) {
          categoryEntity = categoriesRepository.create({
            title: category,
          });
          await categoriesRepository.save(categoryEntity);
        }
        return categoryEntity;
      }),
    );
    return categoryEntities;
  }
}

export default ImportTransactionsService;
