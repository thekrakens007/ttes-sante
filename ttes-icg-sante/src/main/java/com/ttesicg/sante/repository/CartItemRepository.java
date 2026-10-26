package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProduct(
            Cart cart,
            Product product
    );

    Optional<CartItem> findByCartAndBundle(
            Cart cart,
            ProductBundle bundle
    );
    Optional<CartItem> findByCartAndCure(Cart cart, Cure cure);

}