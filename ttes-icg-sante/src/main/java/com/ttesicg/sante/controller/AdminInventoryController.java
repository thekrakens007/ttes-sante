package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.InventoryRequest;
import com.ttesicg.sante.dto.InventoryResponse;
import com.ttesicg.sante.service.InventoryService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
public class AdminInventoryController {



    private final InventoryService inventoryService;




    @GetMapping("/product/{productId}")
    public InventoryResponse find(
            @PathVariable Long productId
    ){

        return inventoryService.findByProductId(productId);

    }




    @PutMapping("/product/{productId}")
    public InventoryResponse update(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryRequest request
    ){

        return inventoryService.update(
                productId,
                request
        );

    }

}