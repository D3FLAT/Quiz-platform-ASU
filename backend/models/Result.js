const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Quiz = require('./Quiz');

const Result = sequelize.define('Result', {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_questions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  answers: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'quiz_results',
  underscored: true,
  timestamps: false
});

Result.belongsTo(User, { foreignKey: 'user_id' });
Result.belongsTo(Quiz, { foreignKey: 'quiz_id' });

module.exports = Result;