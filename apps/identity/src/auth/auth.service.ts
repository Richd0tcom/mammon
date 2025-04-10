import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto';
// import { EmailService } from '../shared/services/email.service';
// import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    // private readonly emailService: EmailService,
    // private readonly walletService: WalletService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP (6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setHours(otpExpiry.getHours() + 1); // OTP valid for 1 hour
    
    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      verificationCode: otp,
      verificationCodeExpiry: otpExpiry,
      isVerified: false,
    });
    
    await this.userRepository.save(user);
    
    // Send verification email
    // await this.emailService.sendVerificationEmail(email, otp);
    
    return { userId: user.id };
  }u

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) return false;
    
    const currentTime = new Date();
    
    // if (
    //   user.verificationCode === otp &&
    //   user.verificationCodeExpiry > currentTime
    // ) {
    //   // Verify user and clear OTP
    //   user.isVerified = true;
    //   user.verificationCode = null;
    //   user.verificationCodeExpiry = null;
    //   await this.userRepository.save(user);
      
    //   // Create default wallet accounts for new user
    //   await this.walletService.createDefaultWallets(user.id);
      
    //   return true;
    // }
    
    return false;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) return null;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) return null;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    
    const payload = { sub: user.id, email: user.email };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
