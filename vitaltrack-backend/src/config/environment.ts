import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    accessExpiration: string;
    refreshExpiration: string;
    resetPasswordExpiration: string;
  };
  encryption: {
    key: string;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  email: {
    sendgridApiKey: string;
    fromEmail: string;
  };
  sms: {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3BucketName: string;
  };
  logging: {
    level: string;
  };
  websocket: {
    pingInterval: number;
    pingTimeout: number;
  };
  alertThresholds: {
    heartRateMin: number;
    heartRateMax: number;
    spo2Min: number;
    respirationRateMin: number;
    respirationRateMax: number;
    stressLevelMax: number;
  };
  fallDetection: {
    impactThreshold: number;
    inactivityThreshold: number;
    inactivityDuration: number;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'vitaltrack_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_in_production',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    resetPasswordExpiration: process.env.JWT_RESET_PASSWORD_EXPIRATION || '10m',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'change_this_32_char_key_prod!!',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@vitaltrack.com',
  },
  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.S3_BUCKET_NAME || 'vitaltrack-files',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000'),
  },
  alertThresholds: {
    heartRateMin: parseInt(process.env.DEFAULT_HEART_RATE_MIN || '50'),
    heartRateMax: parseInt(process.env.DEFAULT_HEART_RATE_MAX || '120'),
    spo2Min: parseInt(process.env.DEFAULT_SPO2_MIN || '90'),
    respirationRateMin: parseInt(process.env.DEFAULT_RESPIRATION_RATE_MIN || '12'),
    respirationRateMax: parseInt(process.env.DEFAULT_RESPIRATION_RATE_MAX || '25'),
    stressLevelMax: parseInt(process.env.DEFAULT_STRESS_LEVEL_MAX || '80'),
  },
  fallDetection: {
    impactThreshold: parseFloat(process.env.FALL_DETECTION_IMPACT_THRESHOLD || '2.5'),
    inactivityThreshold: parseFloat(process.env.FALL_DETECTION_INACTIVITY_THRESHOLD || '0.5'),
    inactivityDuration: parseInt(process.env.FALL_DETECTION_INACTIVITY_DURATION || '10000'),
  },
};
