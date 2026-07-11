import { prisma } from '../database/client';
import { userRepository } from '../repositories/user.repository';
import { calculateProfileCompletion } from './profile.service';
import { logger } from '../utils/logger';
import { Prisma, User } from '@prisma/client';

export interface GoogleProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
  email_verified?: boolean | string;
  locale?: string;
}

export class GoogleSyncService {
  async syncGoogleUser(profile: GoogleProfile): Promise<User> {
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const googleId = profile.sub;
    
    // Extract first name & last name
    const firstName = profile.given_name || profile.name.split(' ')[0] || '';
    const lastName = profile.family_name || profile.name.split(' ').slice(1).join(' ') || '';

    // Extract preferred language from locale (e.g., "en-US" -> "en")
    const locale = profile.locale || 'en';
    const language = locale.split('-')[0];

    // Find if user already exists
    let existingUser = await userRepository.findByGoogleId(googleId);
    if (!existingUser) {
      // Try to find by email to link accounts
      existingUser = await userRepository.findByEmail(profile.email);
    }

    let syncedUser: User;

    if (!existingUser) {
      // First Google Login: Create Account
      logger.info(`[Google Sync] User not found for email: ${profile.email}. Creating new user account.`);
      syncedUser = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: googleId,
            avatarUrl: profile.picture || null,
            googleAvatarUrl: profile.picture || null,
            emailVerified: emailVerified,
            provider: 'google',
            firstName,
            lastName,
            language,
            locale,
            loginCount: 1,
            lastLoginAt: new Date(),
          },
        });

        await tx.userPreferences.create({
          data: {
            userId: newUser.id,
            theme: 'dark',
          },
        });

        await tx.portfolio.create({
          data: {
            userId: newUser.id,
            name: 'Primary Portfolio',
            cashBalance: 100000,
          },
        });

        return newUser;
      });
    } else {
      // Returning Google User: Synchronize mutable fields
      // Do NOT overwrite user manual entries: phoneNumber, dateOfBirth, country, timezone.
      logger.info(`[Google Sync] User found for email: ${profile.email}. Syncing user fields (Login Count: ${existingUser.loginCount + 1}).`);
      const pictureChanged = profile.picture && profile.picture !== existingUser.googleAvatarUrl;
      const shouldUpdateAvatar = pictureChanged && (!existingUser.avatarUrl || existingUser.avatarUrl === existingUser.googleAvatarUrl);

      const updatedData: Prisma.UserUpdateInput = {
        name: profile.name,
        email: profile.email,
        emailVerified: emailVerified,
        googleId: existingUser.googleId || googleId,
        language: existingUser.language || language,
        locale: profile.locale || existingUser.locale,
        loginCount: existingUser.loginCount + 1,
        lastLoginAt: new Date(),
        provider: 'google',
      };

      if (profile.picture) {
        updatedData.googleAvatarUrl = profile.picture;
        if (shouldUpdateAvatar) {
          updatedData.avatarUrl = profile.picture;
        }
      }

      if (firstName && !existingUser.firstName) updatedData.firstName = firstName;
      if (lastName && !existingUser.lastName) updatedData.lastName = lastName;

      syncedUser = await userRepository.update(existingUser.id, updatedData);
    }

    if (!syncedUser) {
      throw new Error('User synchronization failed.');
    }

    // Update Profile Completion Percentage
    const completion = calculateProfileCompletion(syncedUser);
    const finalUser = await userRepository.update(syncedUser.id, { profileCompletion: completion });

    return finalUser;
  }
}

export const googleSyncService = new GoogleSyncService();
export default googleSyncService;
