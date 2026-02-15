const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Quiz = sequelize.define('Quiz', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Quiz;
