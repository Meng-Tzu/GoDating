import { getAllUsers } from "../models/user_model.js";

const getUserIdName = async (req, res) => {
  const data = await getAllUsers();
  const response = { data: data };
  res.status(200).json(response);
  return;
};

export { getUserIdName };
