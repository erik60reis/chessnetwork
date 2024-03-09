// models/user.js
const { DataTypes } = require('sequelize');
const sequelize = sequelizedb;

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
  },
  discordId: {
    type: DataTypes.STRING,
    unique: true,
  },
  webPushSubscription: {
    type: DataTypes.STRING,
  },
});

module.exports = User;
