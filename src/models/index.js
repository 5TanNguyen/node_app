'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.product = require('./product')(sequelize, Sequelize.DataTypes);
db.user = require('./user')(sequelize, Sequelize.DataTypes);
db.order = require('./order')(sequelize, Sequelize.DataTypes);
db.orderDetail = require('./orderDetail')(sequelize, Sequelize.DataTypes);
db.customer = require('./customer')(sequelize, Sequelize.DataTypes);
db.role = require('./role')(sequelize, Sequelize.DataTypes);
db.message = require('./message')(sequelize, Sequelize.DataTypes);

db.sequelize.sync({ force: false})
.then(()=>{
  console.log('yes re-sync done!');
})

// One To Many Relation

db.user.hasMany(db.order, {
  foreignKey: 'user_id',
  as: 'order'
})
db.order.belongsTo(db.user, {
  foreignKey: 'user_id',
  as: 'user'
})

db.order.hasMany(db.orderDetail, {
  foreignKey: 'order_id',
  as: 'orderDetail'
})
db.product.hasMany(db.orderDetail, {
  foreignKey: 'product_id',
  as: 'orderDetail'
})
db.customer.hasMany(db.order, {
  foreignKey: 'customer_id',
  as: 'order'
})
db.orderDetail.belongsTo(db.order, {
  foreignKey: 'order_id',
  as: 'order'
})
db.orderDetail.belongsTo(db.product,{
  foreignKey: 'product_id',
  as: 'product'
})
db.order.belongsTo(db.customer, {
  foreignKey: 'customer_id',
  as: 'customer'
})

db.role.hasMany(db.user, {
  foreignKey: 'role_id',
  as: 'user'
})
db.user.belongsTo(db.role,{
  foreignKey: 'role_id',
  as: 'role'
})

module.exports = db;
