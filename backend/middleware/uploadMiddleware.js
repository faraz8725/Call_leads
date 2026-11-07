import multer from 'multer';

// Use memory storage so we can parse directly via buffer without disk clutter
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'application/csv',
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg'
  ];

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.originalname.match(/\.(xlsx|xls|csv|mp3|wav)$/i)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB
  },
  fileFilter
});
