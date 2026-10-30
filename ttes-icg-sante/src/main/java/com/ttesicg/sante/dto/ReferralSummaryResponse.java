package com.ttesicg.sante.dto;

import java.util.List;

public record ReferralSummaryResponse(
        String referralCode,
        long referredCount,
        Gauge signupGauge,
        Gauge purchaseGauge
) {

    public record Gauge(
            long points,
            Integer currentLevel,
            Integer nextThreshold,
            List<Tier> tiers
    ) {}

    public record Tier(
            int level,
            int threshold,
            String rewardLabel,
            boolean unlocked
    ) {}
}
