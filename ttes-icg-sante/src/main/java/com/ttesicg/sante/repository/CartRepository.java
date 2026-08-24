package com.ttesicg.sante.repository;


import com.ttesicg.sante.entity.Cart;
import com.ttesicg.sante.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;


public interface CartRepository extends JpaRepository<Cart, Long> {


    Optional<Cart> findByUser(User user);


}