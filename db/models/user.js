// models/user.js
const { DataTypes } = require('sequelize');
const sequelize = sequelizedb;

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
  },
  discordId: {
    type: DataTypes.STRING,
    unique: true,
  },
  elo: {
    type: DataTypes.INTEGER,
  },
});

module.exports = User;
