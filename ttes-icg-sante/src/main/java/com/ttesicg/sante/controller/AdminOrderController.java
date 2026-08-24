package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.OrderResponse;
import com.ttesicg.sante.dto.OrderStatusRequest;
import com.ttesicg.sante.service.OrderService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {


    private final OrderService orderService;



    @GetMapping
    public List<OrderResponse> findAll(){

        return orderService.findAllOrders();

    }



    @PutMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @RequestBody OrderStatusRequest request
    ){

        return orderService.updateStatus(
                id,
                request.getStatus()
        );

    }

}