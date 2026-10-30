package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "referral_tiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReferralTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String gauge;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private Integer threshold;

    @Column(name = "reward_label", nullable = false)
    private String rewardLabel;
}
