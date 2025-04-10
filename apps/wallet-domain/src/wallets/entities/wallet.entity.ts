import { User } from "apps/identity/src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  currency: string; // e.g., 'NGN', 'USD'

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance: number;

//   @ManyToOne(() => User, user => user.walletAccounts)
//   user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}