package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.ReferralSummaryResponse;
import com.ttesicg.sante.dto.ReferralSummaryResponse.Gauge;
import com.ttesicg.sante.dto.ReferralSummaryResponse.Tier;
import com.ttesicg.sante.entity.Order;
import com.ttesicg.sante.entity.ReferralEvent;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.ReferralEventRepository;
import com.ttesicg.sante.repository.ReferralTierRepository;
import com.ttesicg.sante.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Parrainage à un seul niveau : un utilisateur ne gagne des points que
 * pour les personnes qu'il a directement parrainées (pas de pyramide).
 * Les points sont cumulatifs : les paliers se débloquent à 50, 100, 200...
 */
@Service
@RequiredArgsConstructor
public class ReferralService {

    private final UserRepository userRepository;
    private final ReferralEventRepository eventRepository;
    private final ReferralTierRepository tierRepository;

    @Value("${referral.signup-points:10}")
    private int signupPoints;

    @Value("${referral.purchase-amount-per-point:1000}")
    private int purchaseAmountPerPoint;

    /** Lie le nouvel utilisateur à son parrain (sans attribuer de points). */
    public void attachReferrer(User newUser, String referralCode) {

        if (referralCode == null || referralCode.isBlank()) {
            return;
        }

        userRepository.findByReferralCode(referralCode.trim().toUpperCase())
                .filter(referrer -> !referrer.getId().equals(newUser.getId()))
                .ifPresent(referrer -> newUser.setReferredById(referrer.getId()));
    }

    /** Points d'inscription, attribués une fois le compte activé. */
    @Transactional
    public void awardSignup(User referred) {

        Long referrerId = referred.getReferredById();

        if (referrerId == null
                || eventRepository.existsByTypeAndReferredUserId(
                        ReferralEvent.SIGNUP, referred.getId())) {
            return;
        }

        eventRepository.save(ReferralEvent.builder()
                .referrerId(referrerId)
                .referredUserId(referred.getId())
                .type(ReferralEvent.SIGNUP)
                .points(signupPoints)
                .build());
    }

    /** Points d'achat, attribués une seule fois par commande livrée. */
    @Transactional
    public void awardPurchase(Order order) {

        User buyer = order.getUser();
        Long referrerId = buyer.getReferredById();

        if (referrerId == null
                || eventRepository.existsByTypeAndOrderId(
                        ReferralEvent.PURCHASE, order.getId())) {
            return;
        }

        BigDecimal total = order.getTotalAmount();
        int points = total == null ? 0
                : total.divide(BigDecimal.valueOf(purchaseAmountPerPoint),
                        0, java.math.RoundingMode.DOWN).intValue();

        if (points <= 0) {
            return;
        }

        eventRepository.save(ReferralEvent.builder()
                .referrerId(referrerId)
                .referredUserId(buyer.getId())
                .orderId(order.getId())
                .type(ReferralEvent.PURCHASE)
                .points(points)
                .build());
    }

    @Transactional(readOnly = true)
    public ReferralSummaryResponse getSummary(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return new ReferralSummaryResponse(
                user.getReferralCode(),
                userRepository.countByReferredById(user.getId()),
                gauge(user.getId(), ReferralEvent.SIGNUP),
                gauge(user.getId(), ReferralEvent.PURCHASE)
        );
    }

    private Gauge gauge(Long userId, String type) {

        long points = eventRepository.sumPoints(userId, type);

        List<Tier> tiers = tierRepository.findByGaugeOrderByThresholdAsc(type)
                .stream()
                .map(t -> new Tier(t.getLevel(), t.getThreshold(),
                        t.getRewardLabel(), points >= t.getThreshold()))
                .toList();

        Integer currentLevel = tiers.stream()
                .filter(Tier::unlocked)
                .map(Tier::level)
                .reduce((a, b) -> b)
                .orElse(null);

        Integer next = tiers.stream()
                .filter(t -> !t.unlocked())
                .map(Tier::threshold)
                .findFirst()
                .orElse(null);

        return new Gauge(points, currentLevel, next, tiers);
    }
}
