import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import type { Address } from "./address.entity";

/**
 * User entity - example entity demonstrating one-to-many relationship.
 */
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl?: string | null;

  @Column({ type: "varchar", default: "active" })
  status: "active" | "inactive" | "suspended";

  /**
   * User's addresses (one-to-many relationship)
   */
  @OneToMany("Address", "user")
  addresses: Address[];
}
