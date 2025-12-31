import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  @InjectRepository(User)
  private readonly userRepo: Repository<User>;
  @InjectRepository(Agent)
  private readonly agentRepo: Repository<Agent>;
  constructor(private readonly emailService: EmailService) {}

  private generateRandomPassword() {
    return crypto.randomBytes(6).toString('base64url').slice(0, 12);
  }

  private generateSixDigitCode(): string {
    const code = crypto.randomInt(0, 1000000);
    return code.toString().padStart(6, '0');
  }

  private async ensureAgentForUser(user: User) {
    const role = (user.role || '').toString().toUpperCase();
    if (role !== 'AGENT') return;

    const email = user.email?.toLowerCase() || null;
    const name =
      [user.name, user.lastName].filter(Boolean).join(' ').trim() || user.email;

    const existing = await this.agentRepo.findOne({
      where: [
        ...(user.id ? [{ userId: user.id }] : []),
        ...(email ? [{ email }] : []),
      ],
    });

    if (existing) {
      existing.name = name || existing.name;
      if (email) existing.email = email;
      if (user.id) existing.userId = user.id;
      existing.isActive =
        user.isActive !== undefined ? user.isActive : existing.isActive;
      await this.agentRepo.save(existing);
      return existing;
    }

    const agent = this.agentRepo.create({
      name,
      email: email || undefined,
      userId: user.id,
      isActive: user.isActive ?? true,
    });
    await this.agentRepo.save(agent);
    return agent;
  }

  async create(createUserDto: Partial<User>) {
    const user = await this.userRepo.save(createUserDto);
    await this.ensureAgentForUser(user);
    return user;
  }

  async createWithInvite(createUserDto: Partial<User>) {
    const email = (createUserDto.email || '').trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const name = (createUserDto.name || '').trim();
    const lastName = (createUserDto.lastName || '').trim();
    const role = createUserDto.role || 'agent';

    const existing = await this.findOneByEmail(email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const password = this.generateRandomPassword();
    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = this.userRepo.create({
      ...createUserDto,
      email,
      name,
      lastName,
      role,
      password: hashedPassword,
      emailVerified: true,
      isActive: createUserDto.isActive ?? true,
    });

    // Persist user first
    await this.userRepo.save(user);

    // Prepare reset flow so the user sets their own password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const resetCode = this.generateSixDigitCode();
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    await this.userRepo.save(user);

    await this.ensureAgentForUser(user);

    return {
      message:
        'User created. Share the reset code so the user can set their password via forgot-password.',
      email: user.email,
      reset: { resetCode },
    };
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOneBy({ email });
  }

  // 👇 AQUÍ ESTÁ LA CORRECCIÓN DE PAGINACIÓN
  async findAll(page: number = 1, limit: number = 10) {
    // Blindaje: Convertimos a Number explícitamente
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const skip = (safePage - 1) * safeLimit;

    // Usamos findAndCount para obtener data + total
    const [users, total] = await this.userRepo.findAndCount({
      skip,
      take: safeLimit,
      order: { id: 'DESC' }, // Ordenar por más recientes
    });

    return {
      data: users,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
  // 👆 FIN DE LA CORRECCIÓN

  async findOne(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findOneByResetToken(resetToken: string) {
    return this.userRepo.findOne({
      where: { resetToken },
    });
  }

  findOneByVerificationToken(verificationToken: string) {
    return this.userRepo.findOne({
      where: { verificationToken },
    });
  }

  save(user: User) {
    return this.userRepo.save(user);
  }

  async blockUser(id: number, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return this.userRepo.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const saved = await this.userRepo.save(user);
    await this.ensureAgentForUser(saved);
    return saved;
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    const agent = await this.agentRepo.findOne({ where: { userId: user.id } });
    if (agent) {
      await this.agentRepo.remove(agent);
    }
    await this.userRepo.remove(user);
    return { message: 'User removed successfully' };
  }
}
