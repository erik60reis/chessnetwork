const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite', // Specify the path to your SQLite database file
});

global.sequelizedb = sequelize;

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

// Sync the models with the database
const User = require('../db/models/user');

sequelize.sync({ force: false })//force: true for development only
.then(() => {
console.log('Database synced');
})
.catch((error) => {
console.error('Error syncing database:', error);
});

global.databaseFunctions = {};


databaseFunctions.updateUserElo = async (userQuery, newelo) => {
    try {
      const user = await User.findOne({
        where: userQuery,
      });
  
      if (user) {
        // Update the longParam field
        user.elo = newelo;
        
        // Save the changes to the database
        await user.save();
  
      } else {

      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
};


databaseFunctions.getUserElo = async (userQuery) => {
    try {
      const user = await User.findOne({
        where: userQuery,
      });
  
      if (user) {
        return user.elo;

      } else {
        
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
};

databaseFunctions.addUserElo = async (userQuery, eloToAdd) => {
    let currentuserelo = await databaseFunctions.getUserElo(userQuery);
    await databaseFunctions.updateUserElo(userQuery, currentuserelo + eloToAdd);
};


databaseFunctions.addUser = async (userdata) => {
    try {
      // Create a new user
      const newUser = await User.create(userdata);
  
      console.log('User added successfully:', newUser.toJSON());
    } catch (error) {
      console.error('Error adding user:', error);
    }
}





