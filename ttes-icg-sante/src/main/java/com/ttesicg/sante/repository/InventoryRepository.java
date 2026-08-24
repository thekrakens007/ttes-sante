package com.ttesicg.sante.repository;


import com.ttesicg.sante.entity.Inventory;
import com.ttesicg.sante.entity.Order;
import com.ttesicg.sante.entity.OrderItem;
import com.ttesicg.sante.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;


public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {


    Optional<Inventory> findByProductId(Long productId);

}