const bcrypt = require("bcrypt");
const User = require("../models/userSchema");

async function createAdmin() {
  const existingAdmin = await User.findOne({ email: "admin@site.com" });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("process.env.ADMIN_PASS", 10);

  await User.create({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS,
    role: process.env.ADMIN_ROLE,
    phone: process.env.ADMIN_PHONE
  });

  console.log("Admin created successfully");
}

module.exports = createAdmin;