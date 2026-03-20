import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';
import Batch from './Batch';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';

interface PaymentAttributes {
    id: string;
    studentId: string;
    courseId?: string;
    batchId?: string;
    amount: number;
    currency: string;
    installmentNumber: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    paymentDate: Date;
    dueDate?: Date;
    receiptNumber: string;
    notes?: string;
    createdBy: string;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'courseId' | 'batchId' | 'currency' | 'installmentNumber' | 'paymentMethod' | 'status' | 'paymentDate' | 'dueDate' | 'notes'> { }

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: string;
    public studentId!: string;
    public courseId?: string;
    public batchId?: string;
    public amount!: number;
    public currency!: string;
    public installmentNumber!: number;
    public paymentMethod!: PaymentMethod;
    public status!: PaymentStatus;
    public paymentDate!: Date;
    public dueDate?: Date;
    public receiptNumber!: string;
    public notes?: string;
    public createdBy!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Payment.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
        courseId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: Course, key: 'id' },
        },
        batchId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: Batch, key: 'id' },
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'INR',
        },
        installmentNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        paymentMethod: {
            type: DataTypes.ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE'),
            allowNull: false,
            defaultValue: 'ONLINE',
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED'),
            allowNull: false,
            defaultValue: 'PAID',
        },
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        receiptNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: 'id' },
        },
    },
    {
        sequelize,
        modelName: 'Payment',
        tableName: 'payments',
        timestamps: true,
    }
);

Payment.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Payment.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Payment.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Payment.belongsTo(Batch, { as: 'batch', foreignKey: 'batchId' });
User.hasMany(Payment, { as: 'payments', foreignKey: 'studentId' });
Batch.hasMany(Payment, { as: 'payments', foreignKey: 'batchId' });
Course.hasMany(Payment, { as: 'payments', foreignKey: 'courseId' });

export default Payment;
