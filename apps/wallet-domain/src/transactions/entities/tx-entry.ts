import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";
import { Transaction } from "./transaction.entity";

@Entity()
export class TransactionEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, transaction => transaction.entries)
  transaction: Transaction;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'uuid' })
  walletAccountId: string;

  @Column()
  currency: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number; // Positive for credit, negative for debit

  @Column({ nullable: true })
  exchangeRate: number; // Used for conversions

  @CreateDateColumn()
  createdAt: Date;
}