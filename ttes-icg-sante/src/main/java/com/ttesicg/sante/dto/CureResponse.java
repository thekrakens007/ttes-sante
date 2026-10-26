package com.ttesicg.sante.dto;

import java.math.BigDecimal;
import java.util.List;

public record CureResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        boolean active,
        BigDecimal totalPrice,
        List<CureProductResponse> items,

        /*
         * Nombre de cures réalisables avec le stock actuel
         * des produits qui la composent.
         */
        Integer availableStock
) {
    public record CureProductResponse(
            Long productId,
            String productName,
            String productImageUrl,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}
}