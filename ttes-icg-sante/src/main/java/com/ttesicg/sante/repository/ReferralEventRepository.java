package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.ReferralEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReferralEventRepository
        extends JpaRepository<ReferralEvent, Long> {

    boolean existsByTypeAndReferredUserId(String type, Long referredUserId);

    boolean existsByTypeAndOrderId(String type, Long orderId);

    long countByReferrerIdAndType(Long referrerId, String type);

    @Query("select coalesce(sum(e.points), 0) from ReferralEvent e "
            + "where e.referrerId = :referrerId and e.type = :type")
    long sumPoints(Long referrerId, String type);
}
