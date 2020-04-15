import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const destinationFolder = path.resolve(__dirname, '..', '..', 'tmp');
export default {
  storage: multer.diskStorage({
    destination: destinationFolder,
    filename(request, file, callback) {
      const hashPrefix = crypto.randomBytes(8).toString('HEX');
      const hashedFileName = `${hashPrefix}-${file.originalname}`;

      return callback(null, hashedFileName);
    },
  }),
  limits: { fileSize: 1024 * 1024 },
  destinationFolder,
};
