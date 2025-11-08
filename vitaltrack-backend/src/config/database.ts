import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Database configuration with proper defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vitaltrack_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres' as const,
  logging: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

const sequelize = new Sequelize(dbConfig);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    logger.info(`Database synchronized ${force ? '(force mode)' : ''}`);
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

export default sequelize;
