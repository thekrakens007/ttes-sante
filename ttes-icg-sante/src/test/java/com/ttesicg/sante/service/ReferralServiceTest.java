package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.ReferralSummaryResponse;
import com.ttesicg.sante.entity.Order;
import com.ttesicg.sante.entity.ReferralEvent;
import com.ttesicg.sante.entity.ReferralTier;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.ReferralEventRepository;
import com.ttesicg.sante.repository.ReferralTierRepository;
import com.ttesicg.sante.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ReferralServiceTest {

    private UserRepository users;
    private ReferralEventRepository events;
    private ReferralTierRepository tiers;
    private ReferralService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        events = mock(ReferralEventRepository.class);
        tiers = mock(ReferralTierRepository.class);
        service = new ReferralService(users, events, tiers);
        ReflectionTestUtils.setField(service, "signupPoints", 10);
        ReflectionTestUtils.setField(service, "purchaseAmountPerPoint", 1000);
    }

    private User user(long id, Long referredBy) {
        return User.builder().id(id).referredById(referredBy).build();
    }

    private Order order(long id, User buyer, String total) {
        return Order.builder().id(id).user(buyer)
                .totalAmount(new BigDecimal(total)).build();
    }

    @Test
    void attachReferrerLinksValidCodeCaseInsensitive() {
        when(users.findByReferralCode("ABC12345")).thenReturn(Optional.of(user(1, null)));
        User newUser = user(2, null);
        service.attachReferrer(newUser, " abc12345 ");
        assertEquals(1L, newUser.getReferredById());
    }

    @Test
    void attachReferrerIgnoresUnknownBlankAndSelfCode() {
        when(users.findByReferralCode("SELF")).thenReturn(Optional.of(user(2, null)));
        User newUser = user(2, null);
        service.attachReferrer(newUser, "SELF");
        service.attachReferrer(newUser, "UNKNOWN");
        service.attachReferrer(newUser, " ");
        service.attachReferrer(newUser, null);
        assertNull(newUser.getReferredById());
    }

    @Test
    void awardSignupGivesPointsToDirectReferrer() {
        service.awardSignup(user(2, 1L));

        ArgumentCaptor<ReferralEvent> cap = ArgumentCaptor.forClass(ReferralEvent.class);
        verify(events).save(cap.capture());
        assertEquals(1L, cap.getValue().getReferrerId());
        assertEquals(10, cap.getValue().getPoints());
        assertEquals(ReferralEvent.SIGNUP, cap.getValue().getType());
    }

    @Test
    void awardSignupSkipsWhenNoReferrerOrAlreadyAwarded() {
        service.awardSignup(user(2, null));
        when(events.existsByTypeAndReferredUserId(ReferralEvent.SIGNUP, 3L)).thenReturn(true);
        service.awardSignup(user(3, 1L));
        verify(events, never()).save(any());
    }

    @Test
    void awardPurchaseComputesPointsFromAmount() {
        service.awardPurchase(order(7, user(2, 1L), "5500"));

        ArgumentCaptor<ReferralEvent> cap = ArgumentCaptor.forClass(ReferralEvent.class);
        verify(events).save(cap.capture());
        assertEquals(5, cap.getValue().getPoints());
        assertEquals(7L, cap.getValue().getOrderId());
        assertEquals(1L, cap.getValue().getReferrerId());
    }

    @Test
    void awardPurchaseSkipsDuplicatesSmallOrdersAndNoReferrer() {
        when(events.existsByTypeAndOrderId(ReferralEvent.PURCHASE, 8L)).thenReturn(true);
        service.awardPurchase(order(8, user(2, 1L), "5000"));
        service.awardPurchase(order(9, user(2, 1L), "999"));
        service.awardPurchase(order(10, user(3, null), "5000"));
        verify(events, never()).save(any());
    }

    @Test
    void summaryUnlocksTiersFromAccumulatedPoints() {
        User me = User.builder().id(1L).referralCode("ME").build();
        when(users.findByEmail("me@x.com")).thenReturn(Optional.of(me));
        when(users.countByReferredById(1L)).thenReturn(3L);
        when(events.sumPoints(1L, ReferralEvent.SIGNUP)).thenReturn(120L);
        when(events.sumPoints(1L, ReferralEvent.PURCHASE)).thenReturn(0L);
        when(tiers.findByGaugeOrderByThresholdAsc(anyString())).thenReturn(List.of(
                new ReferralTier(1L, "SIGNUP", 1, 50, "A"),
                new ReferralTier(2L, "SIGNUP", 2, 100, "B"),
                new ReferralTier(3L, "SIGNUP", 3, 200, "C")));

        ReferralSummaryResponse r = service.getSummary("me@x.com");

        assertEquals("ME", r.referralCode());
        assertEquals(3, r.referredCount());
        assertEquals(2, r.signupGauge().currentLevel());
        assertEquals(200, r.signupGauge().nextThreshold());
        assertTrue(r.signupGauge().tiers().get(1).unlocked());
        assertFalse(r.signupGauge().tiers().get(2).unlocked());
        assertNull(r.purchaseGauge().currentLevel());
        assertEquals(50, r.purchaseGauge().nextThreshold());
    }
}
