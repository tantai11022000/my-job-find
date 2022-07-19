'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            //Allcode
            User.belongsTo(models.Allcode, { foreignKey: 'genderCode', targetKey: 'code', as: 'genderData' })
            
            // //Company
            User.belongsTo(models.Company, { foreignKey: 'companyId', targetKey: 'id', as: 'userCompanyData' })
            User.hasOne(models.Company, { foreignKey: 'userId', as: 'companyUserData' })

            //User
            User.hasOne(models.Account, { foreignKey: 'userId', as: 'userAccountData' })

            // //Cv
            User.hasMany(models.Cv, { foreignKey: 'userId', as: 'userCvData' })

            // //Notification
            // User.hasMany(models.Notification, { foreignKey: 'userId', as: 'userData' })
            
            //OrderPackage
            User.hasMany(models.User,{foreignKey:'userId',as: 'userOrderData'})


            //Post
            User.hasMany(models.Post,{foreignKey: 'userId', as: 'userPostData' })
        }
    };
    User.init({
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        address: DataTypes.STRING,
        genderCode: DataTypes.STRING,
        image: DataTypes.STRING,
        dob: DataTypes.STRING,
        statusCode: DataTypes.STRING,
        companyId: DataTypes.INTEGER,
        file: DataTypes.BLOB('long'),
    }, 
    {
        sequelize,
        modelName: 'User',
    });
    return User;
};