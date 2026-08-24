package com.ttesicg.sante.repository;


import com.ttesicg.sante.entity.Order;
import com.ttesicg.sante.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;


public interface OrderRepository
        extends JpaRepository<Order, Long> {


    List<Order> findByUser(User user);

    List<Order> findByUserId(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();
}