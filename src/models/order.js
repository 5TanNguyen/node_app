'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Order extends Model{
        // 
        // 
        // 
        static associate(models){
            // define association here
        }
    }
    Order.init({
        totalPrice: DataTypes.FLOAT,
        date: DataTypes.DATE,
        address: DataTypes.STRING,
        state: DataTypes.BOOLEAN
    }, {
        sequelize,
        modelName: 'Order',
    });
    return Order;
}