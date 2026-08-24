package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CreateOrderRequest;
import com.ttesicg.sante.dto.OrderResponse;
import com.ttesicg.sante.service.OrderService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;


    /**
     * Passer ma commande
     */
    @PostMapping
    public OrderResponse createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateOrderRequest request
    ) {

        return orderService.createOrderByEmail(
                authentication.getName(),
                request
        );
    }


    /**
     * Voir mes commandes
     */
    @GetMapping("/me")
    public List<OrderResponse> findMyOrders(
            Authentication authentication
    ) {

        return orderService.findMyOrdersByEmail(
                authentication.getName()
        );
    }
}