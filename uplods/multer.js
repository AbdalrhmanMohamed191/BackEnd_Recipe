// const multer = require('multer');
// const path = require('path');


// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images"); // بدون slash في الأول
//   },

//   filename: function (req, file, cb) {
//     const uniqueName =
//       Date.now() + "-" + Math.round(Math.random() * 1e9);

//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage })

// module.exports = upload;


const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = "public/images";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

module.exports = multer({ storage });