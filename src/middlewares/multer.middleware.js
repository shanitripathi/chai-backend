import multer from "multer";
import path from "path";

const __dirname = import.meta.dirname;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/temp"));
  },
  filename: function (req, file, cb) {
    // change this logic later to avoid file name conflicts
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

export { upload };
