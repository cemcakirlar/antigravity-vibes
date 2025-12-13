import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import type { User } from "./user.entity";

/**
 * Address entity - example entity demonstrating many-to-one relationship.
 */
@Entity("addresses")
export class Address extends BaseEntity {
  @Column({ type: "varchar" })
  label: string; // 'home', 'work', 'other'

  @Column({ type: "varchar" })
  street: string;

  @Column({ type: "varchar" })
  city: string;

  @Column({ type: "varchar" })
  country: string;

  @Column({ type: "varchar", nullable: true })
  postalCode?: string | null;

  /**
   * The user this address belongs to (many-to-one relationship)
   */
  @ManyToOne("User", "addresses", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar" })
  userId: string;
}
