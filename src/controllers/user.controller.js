import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiRespnose.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  // steps to register a user
  // check if the request has a body
  // get username, fullname, email, password etc from the body and send it to the user model
  // if the save is successful then send a 200 back to the client else send an error

  const { fullname, email, username, password } = req.body;
  console.log(fullname, email, username, password);

  const isEmpty = [fullname, username, email, password].some((field) => {
    return !field;
  });

  if (isEmpty) {
    console.log("yes it is empty", isEmpty);
    throw new ApiError(400, "All fields are compulsory");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }
  console.log(req.files);
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

export { registerUser };
