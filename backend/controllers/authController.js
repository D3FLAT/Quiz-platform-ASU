const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('LOGIN ATTEMPT:', { email });
  try {
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: email }]
      }
    });
    console.log('FOUND USER:', user ? user.dataValues : null);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};