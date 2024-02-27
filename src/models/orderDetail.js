'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class OrderDetail extends Model{
        // 
        // 
        // 
        static associate(models){
            // define association here
        }
    }
    OrderDetail.init({
        quantity: DataTypes.FLOAT,
        price: DataTypes.FLOAT
    }, {
        sequelize,
        modelName: 'OrderDetail',
    });
    return OrderDetail;
}