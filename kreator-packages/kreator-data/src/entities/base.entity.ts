import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column, BaseEntity as TypeORMBaseEntity } from "typeorm";

/**
 * Base entity with common audit fields.
 *
 * Features:
 * - UUID primary key
 * - Automatic createdAt/updatedAt timestamps
 * - Soft delete support (deletedAt)
 * - Optional createdBy/updatedBy tracking
 *
 * @example
 * ```typescript
 * @Entity('products')
 * export class Product extends BaseEntity {
 *   @Column()
 *   name: string;
 * }
 * ```
 */
export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  @Column({ type: "varchar", nullable: true })
  createdBy?: string | null;

  @Column({ type: "varchar", nullable: true })
  updatedBy?: string | null;
}
