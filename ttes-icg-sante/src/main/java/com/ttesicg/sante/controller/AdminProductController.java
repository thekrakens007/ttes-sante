package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.service.ProductService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;



@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {



    private final ProductService productService;



    /**
     * Création d'un produit
     */
    @PostMapping
    public ProductResponse create(
            @Valid @RequestBody ProductRequest request
    ){

        return productService.create(request);

    }

    @PutMapping("/{id}")
    public ProductResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ){
        return productService.update(id, request);
    }





    /**
     * Liste des produits
     */
    @GetMapping
    public List<ProductResponse> findAll(){

        return productService.findAll();

    }
    @GetMapping("/{id}")
    public ProductResponse findById(
            @PathVariable Long id
    ){
        return productService.findById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id
    ) {

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

}