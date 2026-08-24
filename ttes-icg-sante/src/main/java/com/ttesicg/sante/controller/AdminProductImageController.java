package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.ProductImageRequest;
import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.service.ProductImageService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductImageController {



    private final ProductImageService productImageService;




    @PostMapping("/{productId}/images")
    public ProductImageResponse addImage(
            @PathVariable Long productId,
            @Valid @RequestBody ProductImageRequest request
    ){

        return productImageService.addImage(
                productId,
                request
        );

    }





    @DeleteMapping("/images/{id}")
    public void delete(
            @PathVariable Long id
    ){

        productImageService.delete(id);

    }

}