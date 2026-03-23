import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
    id: string;
    username?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    profileImage?: string | null;
    password: string;
    role: 'SUPER_ADMIN' | 'CMS_MANAGER' | 'Faculty' | 'STUDENT';
    specialization?: string | null;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'username' | 'firstName' | 'middleName' | 'lastName' | 'phone' | 'profileImage' | 'specialization' | 'isActive' | 'createdAt' | 'updatedAt'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public username?: string | null;
    public firstName?: string | null;
    public middleName?: string | null;
    public lastName?: string | null;
    public name!: string;
    public email!: string;
    public phone?: string | null;
    public profileImage?: string | null;
    public password!: string;
    public role!: 'SUPER_ADMIN' | 'CMS_MANAGER' | 'Faculty' | 'STUDENT';
    public specialization?: string | null;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        middleName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('SUPER_ADMIN', 'CMS_MANAGER', 'Faculty', 'STUDENT'),
            defaultValue: 'STUDENT',
            allowNull: false,
        },
        specialization: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
    }
);

export default User;
