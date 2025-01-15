import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiRespnose.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch {
    throw new Error(
      500,
      "Something went wrong will generating the access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // steps to register a user
  // check if the request has a body
  // get username, fullname, email, password etc from the body and send it to the user model
  // if the save is successful then send a 200 back to the client else send an error

  const { fullname, email, username, password } = req.body;

  const isEmpty = [fullname, username, email, password].some((field) => {
    return !field;
  });

  if (isEmpty) {
    throw new ApiError(400, "All fields are compulsory");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Add a valid Avatar");
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const response = new ApiResponse(
    201,
    "User registered successfully",
    createdUser
  );

  res.status(response.statusCode).json(response);
});

const loginUser = asyncHandler(async (req, res) => {
  // get email/username and password from the user
  // check if the fields are valid
  // check the password with the dbs password
  // if the passwords match then send a json saying login successful

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "You need username or email to login");
  }
  if (!password) {
    throw new ApiError(400, "Please provide a password");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(
      400,
      "An account with this username or email doesn't exist"
    );
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid username or email or password");
  }
  // at this point send the access token
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -createdAt -updatedAt -__v"
  );

  const response = new ApiResponse(200, "You are logged in!", {
    user: loggedInUser,
    accessToken,
    refreshToken,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(response.statusCode)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(response);
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $unset: { refreshToken: "" },
    },
    {
      new: true,
    }
  );

  console.log("looged out userfsfdfad", user);
  // clear the cookies
  res.clearCookie("accessToken").clearCookie("refreshToken").status(204).send();
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get the refresh token
  // if the refresh token is valid then decode it
  // get the user from it
  // if the user exists then create a new access token
  // save the access token in the cookie and send it back in the data.

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized");
  }
  const { _id: userId } = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(userId);

  console.log("this is the refresh token user", user);

  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Invalid refresh token, please login again!");
  }

  const accessToken = user.generateAccessToken();
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  const response = new ApiResponse(
    200,
    "Access token successfully generated",
    accessToken
  );
  res
    .status(response.statusCode)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(response);
});

export { registerUser, loginUser, logoutUser };
