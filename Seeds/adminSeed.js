const bcrypt = require("bcrypt");
const User = require("../models/userSchema");

async function createAdmin() {
  try {
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASS,
      10
    );

    await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: process.env.ADMIN_ROLE,
      phone: process.env.ADMIN_PHONE,
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("Create Admin Error:", error.message);
  }
}

module.exports = createAdmin;