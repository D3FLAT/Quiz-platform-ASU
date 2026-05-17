const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Quiz = sequelize.define('Quiz', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  author: {
    type: DataTypes.STRING,
    defaultValue: 'system'
  },
  times_taken: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'quizzes',
  underscored: true,
  timestamps: false
});

module.exports = Quiz;