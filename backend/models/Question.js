const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Quiz = require('./Quiz');

const Question = sequelize.define('Question', {
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  correct_answer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'questions',  // ← добавь
  underscored: true,
  timestamps: false
});

module.exports = Question;
