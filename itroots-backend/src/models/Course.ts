import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type CourseStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

interface CourseAttributes {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    slug: string;
    price: number;
    duration?: string;
    category?: string;
    status: CourseStatus;
    isPublished: boolean;
    instructorId: string;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'description' | 'thumbnail' | 'duration' | 'category' | 'status' | 'isPublished'> { }

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    public id!: string;
    public title!: string;
    public description?: string;
    public thumbnail?: string;
    public slug!: string;
    public price!: number;
    public duration?: string;
    public category?: string;
    public status!: CourseStatus;
    public isPublished!: boolean;
    public instructorId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Course.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        thumbnail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        duration: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'DRAFT', 'ARCHIVED'),
            allowNull: false,
            defaultValue: 'DRAFT',
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        instructorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: 'Course',
        tableName: 'courses',
        timestamps: true,
    }
);

Course.belongsTo(User, { as: 'instructor', foreignKey: 'instructorId' });
User.hasMany(Course, { as: 'courses', foreignKey: 'instructorId' });

export default Course;
