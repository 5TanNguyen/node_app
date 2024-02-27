'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Product extends Model{
        // 
        // 
        // 
        static associate(models){
            // define association here
        }
    }
    Product.init({
        name: DataTypes.STRING,
        species: DataTypes.STRING,
        description: DataTypes.STRING,
        birthDate: DataTypes.DATE,
        imgUrl: DataTypes.STRING

    }, {
        sequelize,
        modelName: 'Product',
    });
    return Product;
}