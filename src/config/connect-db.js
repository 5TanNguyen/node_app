const { Sequelize } = require('sequelize');

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('node_app', 'root', 'Redtoso5', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

const connectionDatabase = async() =>{
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

connectionDatabase()