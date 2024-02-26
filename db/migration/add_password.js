'use strict';
//npx sequelize-cli migration:generate --name add_password2_column
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING,
    });

    // Generate a random password for existing users
    const users = await queryInterface.sequelize.query('SELECT * FROM Users', { type: Sequelize.QueryTypes.SELECT });

    const updatePromises = users.map(async (user) => {
      const randomPassword = crypto.randomBytes(1024).toString('hex'); // Change the length as needed
      await queryInterface.sequelize.query(`UPDATE Users SET password = '${randomPassword}' WHERE id = ${user.id}`);
    });

    await Promise.all(updatePromises);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'password');
  },
};
