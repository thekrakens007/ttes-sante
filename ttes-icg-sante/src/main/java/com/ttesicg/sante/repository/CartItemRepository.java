package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.Cart;
import com.ttesicg.sante.entity.CartItem;
import com.ttesicg.sante.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProduct(
            Cart cart,
            Product product
    );

}