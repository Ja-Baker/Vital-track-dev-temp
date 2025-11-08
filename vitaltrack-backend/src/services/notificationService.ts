import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import admin from 'firebase-admin';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { User, Facility } from '../models';

// Initialize services
if (config.email.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

const twilioClient = config.sms.twilioAccountSid && config.sms.twilioAuthToken
  ? twilio(config.sms.twilioAccountSid, config.sms.twilioAuthToken)
  : null;

// Initialize Firebase Admin (if credentials provided)
if (config.firebase.projectId && config.firebase.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
  } catch (error) {
    logger.warn('Firebase Admin initialization failed', { error });
  }
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

interface SMSOptions {
  to: string | string[];
  message: string;
}

interface PushNotificationOptions {
  tokens: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export class NotificationService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!config.email.sendgridApiKey) {
      logger.warn('SendGrid not configured, skipping email');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      await sgMail.send({
        to: recipients,
        from: config.email.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      logger.info('Email sent', {
        recipients: recipients.length,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('Email send failed', { error, options });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: 'VitalTrack - Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your VitalTrack account.</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!twilioClient) {
      logger.warn('Twilio not configured, skipping SMS');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      await Promise.all(
        recipients.map(phoneNumber =>
          twilioClient!.messages.create({
            body: options.message,
            from: config.sms.twilioPhoneNumber,
            to: phoneNumber,
          })
        )
      );

      logger.info('SMS sent', {
        recipients: recipients.length,
        message: options.message.substring(0, 50),
      });

      return true;
    } catch (error) {
      logger.error('SMS send failed', { error, options });
      return false;
    }
  }

  async sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
    try {
      const tokens = Array.isArray(options.tokens) ? options.tokens : [options.tokens];

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data,
        android: {
          priority: options.priority || 'high',
          notification: {
            sound: 'default',
            channelId: 'vitaltrack_alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().sendMulticast(message);

      logger.info('Push notifications sent', {
        success: response.successCount,
        failure: response.failureCount,
        tokens: tokens.length,
      });

      return response.successCount > 0;
    } catch (error) {
      logger.error('Push notification send failed', { error, options });
      return false;
    }
  }

  async notifyStaffOfAlert(
    facilityId: string,
    alertTitle: string,
    alertMessage: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      // Get all active staff for the facility
      const staff = await User.findAll({
        where: {
          facilityId,
          isActive: true,
        },
      });

      if (staff.length === 0) {
        logger.warn('No staff found for facility', { facilityId });
        return;
      }

      // TODO: Get device tokens from user records (would need to add fcmToken field to User model)
      // For now, just log
      logger.info('Would notify staff of alert', {
        facilityId,
        staffCount: staff.length,
        alertTitle,
      });

      // Send SMS to staff with phone numbers (for critical alerts)
      if (data?.alertType === 'critical') {
        const phoneNumbers = staff
          .filter(s => s.phoneNumber)
          .map(s => s.phoneNumber!);

        if (phoneNumbers.length > 0) {
          await this.sendSMS({
            to: phoneNumbers,
            message: `CRITICAL ALERT: ${alertTitle} - ${alertMessage}`,
          });
        }
      }

      // Send emails
      const emails = staff.map(s => s.email);
      if (emails.length > 0) {
        await this.sendEmail({
          to: emails,
          subject: `VitalTrack Alert: ${alertTitle}`,
          text: alertMessage,
          html: `
            <h2 style="color: ${data?.alertType === 'critical' ? '#f44336' : '#ff9800'};">
              ${alertTitle}
            </h2>
            <p>${alertMessage}</p>
            <p>Please check the VitalTrack mobile app for more details.</p>
          `,
        });
      }
    } catch (error) {
      logger.error('Staff notification failed', { error, facilityId });
    }
  }

  async sendWelcomeEmail(user: User, facility: Facility, temporaryPassword: string): Promise<boolean> {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to VitalTrack',
      text: `Welcome to VitalTrack, ${user.firstName}!\n\nYour account has been created for ${facility.name}.\n\nFacility Code: ${facility.facilityCode}\nEmail: ${user.email}\nTemporary Password: ${temporaryPassword}\n\nPlease log in and change your password immediately.`,
      html: `
        <h2>Welcome to VitalTrack, ${user.firstName}!</h2>
        <p>Your account has been created for <strong>${facility.name}</strong>.</p>
        <h3>Login Credentials:</h3>
        <ul>
          <li><strong>Facility Code:</strong> ${facility.facilityCode}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
        </ul>
        <p><strong>Please log in and change your password immediately.</strong></p>
        <p>Download the VitalTrack mobile app to get started.</p>
      `,
    });
  }

  async sendTestNotification(type: 'email' | 'sms' | 'push', target: string): Promise<boolean> {
    try {
      switch (type) {
        case 'email':
          return await this.sendEmail({
            to: target,
            subject: 'VitalTrack Test Email',
            text: 'This is a test email from VitalTrack.',
          });

        case 'sms':
          return await this.sendSMS({
            to: target,
            message: 'This is a test SMS from VitalTrack.',
          });

        case 'push':
          return await this.sendPushNotification({
            tokens: target,
            title: 'VitalTrack Test',
            body: 'This is a test push notification from VitalTrack.',
          });

        default:
          return false;
      }
    } catch (error) {
      logger.error('Test notification failed', { error, type, target });
      return false;
    }
  }
}

export default new NotificationService();
