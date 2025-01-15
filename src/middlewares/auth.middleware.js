import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    // get the token first, either from cookie or auth headers
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(400, "Missing access token");
    }

    // verify the jwt token and get the id out of it
    const { _id: userId } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "Invalid access token");
    }

    // save the userId to the request object
    req.userId = userId;

    next();
  } catch {
    throw new ApiError(500, "Something went wrong");
  }
});

export { verifyJwt };
