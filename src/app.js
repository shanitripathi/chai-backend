import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// includes body of the request
app.use(
  express.json({
    limit: "16kb",
  })
);
// decodes the encoded url
app.use(urlencoded({ extended: true, limit: "16kb" }));

// middleware to serve static files
app.use(express.static("public"));

// middleware to parse cookies
app.use(cookieParser());

// routes

import userRouter from "./routes/user.route.js";

app.get("/", (req, res) => {
  res.send("hello got it");
});

app.use("/api/v1/users", userRouter);

export default app;
