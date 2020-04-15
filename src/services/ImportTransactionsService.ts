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

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const categories = parsedTransactions
      .reduce((uniqueCategories, transaction) => {
        if (uniqueCategories.indexOf(transaction.category.toString()) < 0) {
          uniqueCategories.push(transaction.category);
        }
        return uniqueCategories;
      }, [] as string[])
      .map(async category => {
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
      });
    const categoryIdByTitle = await (await Promise.all(categories)).reduce(
      (map, category) => {
        map.set(category.title, category.id);
        return map;
      },
      new Map<string, string>(),
    );
    console.log(categories);

    console.log(categoryIdByTitle);

    const transactions = await Promise.all(
      parsedTransactions.map(async parsedTransaction => {
        return transactionsRepository.create({
          title: parsedTransaction.title,
          type: parsedTransaction.type,
          value: parsedTransaction.value,
          category_id: categoryIdByTitle.get(parsedTransaction.category),
        });
      }),
    ).then(values => transactionsRepository.save(values));

    return transactions;
  }
}

export default ImportTransactionsService;
