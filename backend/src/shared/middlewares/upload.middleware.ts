import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { Request } from "express";

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("Upload directory creation warning:", err);
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let subDir = "misc";
    if (file.fieldname === "companyLogo") {
      subDir = "companyLogos";
    } else if (file.fieldname === "profilePicture") {
      subDir = "profilePictures";
    } else if (file.fieldname === "catalogueMedia") {
      subDir = "catalogue";
    } else if (file.fieldname === "postImage") {
      subDir = "posts";
    }

    const targetDir = path.join(uploadDir, subDir);

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch (err) {
      console.warn("Target upload directory creation warning:", err);
    }

    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, WEBP, MP4, WEBM, and MOV are allowed.",
      ),
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter,
});
