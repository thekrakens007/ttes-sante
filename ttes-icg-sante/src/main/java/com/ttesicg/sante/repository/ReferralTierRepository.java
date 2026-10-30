package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.ReferralTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReferralTierRepository
        extends JpaRepository<ReferralTier, Long> {

    List<ReferralTier> findByGaugeOrderByThresholdAsc(String gauge);
}
