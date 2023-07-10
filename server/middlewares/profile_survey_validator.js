import { check, validationResult } from "express-validator";
import { body } from "express-validator";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
const sep = path.sep;
__dirname = __dirname.replace(`${sep}server${sep}middlewares`, "");

// TODO: 照片驗證 (小卻給的兩個 if 都無效)
const imageValidator = body("image").custom((value, { req, res, next }) => {
  if (!req.files || !req.files.image) {
    console.log("No Image.");
    return res.status(400).json({ error: "Image is required" });
  }

  const image = req.files.image;

  // 沒有檢查到格式
  if (!image.mimetype.startsWith("image")) {
    console.log("File must be an image");
    return res.status(400).json({ error: "File must be an image" });
  }

  return true;
});

// 其他條件驗證
const criteria = [
  check("userId").exists().notEmpty().withMessage("userId is required.").bail(),
  check("birthday")
    .exists()
    .notEmpty()
    .withMessage("birthday is required.")
    .bail(),
  check("sexId").exists().notEmpty().withMessage("sexId is required.").bail(),
  check("orientationId")
    .exists()
    .notEmpty()
    .withMessage("orientationId is required.")
    .bail(),
  check("seekAgeMin")
    .exists()
    .notEmpty()
    .withMessage("seeking min-age is required.")
    .bail(),
  check("seekAgeMax")
    .exists()
    .notEmpty()
    .withMessage("seeking max-age is required.")
    .bail(),
  check("selfIntro")
    .exists()
    .notEmpty()
    .withMessage("selfIntro is required.")
    .bail(),
  (req, res, next) => {
    const picture = req.files.picture;
    // 檢查圖片是否有填
    if (!picture) {
      res.status(400).json({ data: "error: Image is required." });
      return;
    }
    const pictureName = picture[0].filename;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const imagePath = path.resolve(__dirname, `public/images/${pictureName}`);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Cannot delete image: ${err}`);
        }
      });

      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (req.body.sexId === "undefined") {
      const imagePath = path.resolve(__dirname, `public/images/${pictureName}`);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Cannot delete image: ${err}`);
        }
      });

      res.status(400).json({ error: "sexId is required." });
      return;
    } else if (req.body.orientationId === "undefined") {
      const imagePath = path.resolve(__dirname, `public/images/${pictureName}`);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Cannot delete image: ${err}`);
        }
      });

      res.status(400).json({ error: "orientationId is required." });
      return;
    }

    next();
  },
];

// 配對條件驗證
const matchCriteria = [
  check("userId").exists().notEmpty().withMessage("userId is required.").bail(),
  check("seekAgeMin")
    .exists()
    .notEmpty()
    .withMessage("seeking min-age is required.")
    .bail(),
  check("seekAgeMax")
    .exists()
    .notEmpty()
    .withMessage("seeking max-age is required.")
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    if (!req.body.orientationId) {
      res.status(400).json({ error: "orientationId is required." });
      return;
    }

    next();
  },
];

export { imageValidator, criteria, matchCriteria };
