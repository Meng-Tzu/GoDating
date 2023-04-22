import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Function1: 計算的年齡
const getAge = (dateString) => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  // 如果今天還沒到自己的生日月份，或還沒到自己生日當天，age 要減一歲
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// 圖片上傳
// 設定圖片儲存目的地&檔名
const storagePicture = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const filename = uuidv4();
    // 取得副檔名
    const ext = file.originalname.split(".")[1];

    cb(null, `${filename}.${ext}`);
  },
});

// 限制上傳檔案的規格
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    return cb(null, true);
  }
  cb(new Error("Please upload an image"));
};

// 圖片上傳設定
const upload = multer({
  limit: {
    // 限制上傳檔案的大小為 1MB
    fileSize: 1000000,
  },
  storage: storagePicture,
  fileFilter: fileFilter,
});

export { getAge, upload };
