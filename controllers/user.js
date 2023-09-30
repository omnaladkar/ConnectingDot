const { validationResult,check} = require('express-validator');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { setUser } = require('../service/auth');

// Validation middleware for email and password
const validateEmailAndPassword = [
  check('email').isEmail().withMessage('Invalid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

async function handleUserSignup(req, res) {
  const { name, email, password } = req.body;

  // Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('signup', { errors: errors.array() });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render('signup', { error: 'Email already in use' });
  }

  // Hash the password
  const saltRounds = 10; // You can adjust this value for security
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create a new user
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
  });

  await newUser.save();
  return res.redirect('/');
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;

  // Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array() });
  }

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', {
      error: 'Invalid email or password',
    });
  }

  const token = setUser(user);
  res.cookie('uid', token);
  return res.redirect('/');
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
  validateEmailAndPassword,
};
