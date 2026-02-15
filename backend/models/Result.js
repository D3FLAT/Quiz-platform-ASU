const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Quiz = require('./Quiz');

const Result = sequelize.define('Result', {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

Result.belongsTo(User);
Result.belongsTo(Quiz);

module.exports = Result;
