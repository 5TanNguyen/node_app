'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ProductPrice extends Model{
        // 
        // 
        // 
        static associate(models){
            // define association here
        }
    }
    ProductPrice.init({
        price: DataTypes.FLOAT,
        beginDate: DataTypes.DATE,
        endDate: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'ProductPrice',
    });
    return ProductPrice;
}