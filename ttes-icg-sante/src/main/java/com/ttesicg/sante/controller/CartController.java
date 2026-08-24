package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CartItemRequest;
import com.ttesicg.sante.dto.CartResponse;
import com.ttesicg.sante.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;


    /**
     * Voir mon panier
     */
    @GetMapping("/me")
    public CartResponse getMyCart(
            Authentication authentication
    ) {

        return cartService.getCartByEmail(
                authentication.getName()
        );
    }


    /**
     * Ajouter un produit à mon panier
     */
    @PostMapping("/me/items")
    public CartResponse addItem(
            Authentication authentication,
            @Valid @RequestBody CartItemRequest request
    ) {

        return cartService.addItemByEmail(
                authentication.getName(),
                request
        );
    }


    /**
     * Modifier la quantité
     */
    @PutMapping("/me/items/{itemId}")
    public CartResponse updateQuantity(
            Authentication authentication,
            @PathVariable Long itemId,
            @RequestParam Integer quantity
    ) {

        return cartService.updateQuantityByEmail(
                authentication.getName(),
                itemId,
                quantity
        );
    }


    /**
     * Supprimer un article
     */
    @DeleteMapping("/me/items/{itemId}")
    public CartResponse removeItem(
            Authentication authentication,
            @PathVariable Long itemId
    ) {

        return cartService.removeItemByEmail(
                authentication.getName(),
                itemId
        );
    }
}