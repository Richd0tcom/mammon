import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { TransactionEntry } from "./tx-entry";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  type: string; // 'FUNDING', 'CONVERSION', 'TRADE'

  @Column({ nullable: true })
  reference: string; // External reference or idempotency key

  @Column({ default: 'PENDING' })
  status: string; // 'PENDING', 'COMPLETED', 'FAILED'

  @Column({ nullable: true })
  metadata: string; // JSON string for additional details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TransactionEntry, entry => entry.transaction)
  entries: TransactionEntry[];
}