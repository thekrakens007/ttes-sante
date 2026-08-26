package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.ProductImageRequest;
import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.service.ProductImageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductImageController {

    private final ProductImageService productImageService;

    @GetMapping("/{productId}/images")
    public List<ProductImageResponse> getImages(
            @PathVariable Long productId,
            Authentication authentication
    ) {
        System.out.println("USER = " + authentication.getName());
        System.out.println("AUTHORITIES = " + authentication.getAuthorities());

        return productImageService.findByProduct(productId);
    }


    @PostMapping("/{productId}/images")
    public ProductImageResponse addImage(
            @PathVariable Long productId,
            @Valid @RequestBody ProductImageRequest request,
            Authentication authentication
    ) {
        System.out.println("===== ADD IMAGE =====");
        System.out.println("USER = " + authentication.getName());
        System.out.println("AUTHORITIES = " + authentication.getAuthorities());

        return productImageService.addImage(
                productId,
                request
        );
    }

    @DeleteMapping("/images/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        productImageService.delete(id);
    }
}