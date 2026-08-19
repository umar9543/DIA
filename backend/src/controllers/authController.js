const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const pool = getPool();
    
    // Check if user exists
    const checkResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user and return id
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, passwordHash)
      .query(`
        INSERT INTO users (email, password_hash)
        OUTPUT inserted.id
        VALUES (@email, @password_hash)
      `);

    const userId = result.recordset[0].id;

    // Generate token
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ token, user: { id: userId, email } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const pool = getPool();

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};
