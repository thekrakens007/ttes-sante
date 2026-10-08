package com.ttesicg.sante.dto;

import java.math.BigDecimal;
import java.util.Set;

public record BundleItemResponse(

        Long id,
        Long productId,
        String productName,
        String sku,
        String description,
        String brand,
        String activeIngredient,
        String dosage,
        String form,
        String ingredients,
        BigDecimal unitPrice,
        Integer quantity,
        Integer availableStock,
        Long companyId,
        String companyName,
        Set<Long> categoryIds,
        Set<String> categories,
        Set<Long> therapeuticAreaIds,
        Set<String> therapeuticAreas

) {
}
