const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Quiz = require('./Quiz');

const Question = sequelize.define('Question', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  correctIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

Question.belongsTo(Quiz);
Quiz.hasMany(Question);

module.exports = Question;
