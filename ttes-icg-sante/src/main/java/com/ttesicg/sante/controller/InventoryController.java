package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.InventoryRequest;
import com.ttesicg.sante.dto.InventoryResponse;
import com.ttesicg.sante.service.InventoryService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {


    private final InventoryService inventoryService;



    // Voir le stock d'un produit
    @GetMapping("/product/{productId}")
    public InventoryResponse getStock(
            @PathVariable Long productId
    ){

        return inventoryService.findByProductId(productId);

    }



    // Modifier le stock (ADMIN seulement)
    @PutMapping("/product/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryResponse updateStock(
            @PathVariable Long productId,
            @RequestBody InventoryRequest request
    ){

        return inventoryService.update(productId, request);

    }

}