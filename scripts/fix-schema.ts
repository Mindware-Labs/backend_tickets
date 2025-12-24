import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../src/auth/entities/user.entity';

// Load environment variables
config();

async function fixSchema() {
  console.log('🔧 Starting database schema fix...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    entities: [User],
    synchronize: false, // We'll manually sync
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Get the query runner
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('📋 Checking and adding missing columns...\n');

    // Check and add emailVerified
    const emailVerifiedExists = await queryRunner.hasColumn('users', 'emailVerified');
    if (!emailVerifiedExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
      `);
      console.log('✅ Added column: emailVerified');
    } else {
      console.log('✓ Column emailVerified already exists');
    }

    // Check and add verificationToken
    const verificationTokenExists = await queryRunner.hasColumn('users', 'verificationToken');
    if (!verificationTokenExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "verificationToken" VARCHAR(255);
      `);
      console.log('✅ Added column: verificationToken');
    } else {
      console.log('✓ Column verificationToken already exists');
    }

    // Check and add verificationTokenExpiry
    const verificationTokenExpiryExists = await queryRunner.hasColumn('users', 'verificationTokenExpiry');
    if (!verificationTokenExpiryExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "verificationTokenExpiry" TIMESTAMP;
      `);
      console.log('✅ Added column: verificationTokenExpiry');
    } else {
      console.log('✓ Column verificationTokenExpiry already exists');
    }

    // Check and add resetToken
    const resetTokenExists = await queryRunner.hasColumn('users', 'resetToken');
    if (!resetTokenExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "resetToken" VARCHAR(255);
      `);
      console.log('✅ Added column: resetToken');
    } else {
      console.log('✓ Column resetToken already exists');
    }

    // Check and add resetTokenExpiry
    const resetTokenExpiryExists = await queryRunner.hasColumn('users', 'resetTokenExpiry');
    if (!resetTokenExpiryExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "resetTokenExpiry" TIMESTAMP;
      `);
      console.log('✅ Added column: resetTokenExpiry');
    } else {
      console.log('✓ Column resetTokenExpiry already exists');
    }

    // Check and add createdAt
    const createdAtExists = await queryRunner.hasColumn('users', 'createdAt');
    if (!createdAtExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added column: createdAt');
    } else {
      console.log('✓ Column createdAt already exists');
    }

    // Check and add updatedAt
    const updatedAtExists = await queryRunner.hasColumn('users', 'updatedAt');
    if (!updatedAtExists) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added column: updatedAt');
    } else {
      console.log('✓ Column updatedAt already exists');
    }

    await queryRunner.release();

    console.log('\n✨ Database schema fixed successfully!');
    console.log('🚀 You can now restart your backend server.\n');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

fixSchema();

