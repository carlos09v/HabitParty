package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class UserSubscriptionJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "user_id")
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "user_id")
  private UserJpaEntity user;

  @Builder.Default
  @Column(name = "is_premium", nullable = false)
  private boolean isPremium = false;

  @Builder.Default
  @Column(name = "is_founder", nullable = false, columnDefinition = "boolean default false")
  private boolean isFounder = false;

  @Column(name = "stripe_customer_id", unique = true)
  private String stripeCustomerId;

  @Column(name = "stripe_subscription_id")
  private String stripeSubscriptionId;

  @ToString.Include
  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(name = "subscription_status", nullable = false, length = 50)
  private SubscriptionStatus subscriptionStatus = SubscriptionStatus.FREE;

  @Column(name = "subscription_ends_at")
  private LocalDateTime subscriptionEndsAt;

  @Column(name = "prepaid_ends_at")
  private LocalDateTime prepaidEndsAt;

  @Builder.Default
  @Column(name = "cancel_at_period_end", nullable = false, columnDefinition = "boolean default false")
  private boolean cancelAtPeriodEnd = false;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Version
  @Setter(AccessLevel.NONE)
  @Column(name = "version", nullable = false, columnDefinition = "bigint default 0")
  private Long version;
}
