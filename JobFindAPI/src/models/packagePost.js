'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PackagePost extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {

            //orderpackage
            PackagePost.hasMany(models.OrderPackage,{foreignKey: 'packagePostId',targetKey:'id',as:'packageOrderData'})
        }
    };
    PackagePost.init({
        name: DataTypes.STRING,
        value: DataTypes.INTEGER,
        price: DataTypes.DOUBLE,
        isHot: DataTypes.TINYINT
    }, 
    {
        sequelize,
        modelName: 'PackagePost',
    });
    return PackagePost;
};