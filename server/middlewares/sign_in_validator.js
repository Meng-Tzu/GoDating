import { check, validationResult } from "express-validator";

export default [
  check("inputEmail")
    .exists()
    .notEmpty()
    .withMessage("email is required.")
    .bail()
    .isEmail()
    .withMessage("Invalid email format.")
    .bail(),
  check("inputPassword")
    .exists()
    .withMessage("password is required.")
    .bail()
    .isLength({ min: 7, max: 16 })
    .withMessage("password length should be between 7 - 16"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      // FIXME: 錯誤的密碼直接洩漏給前端?
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];
