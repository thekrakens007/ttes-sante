package com.ttesicg.sante.dto;

import java.math.BigDecimal;

public record BundleItemResponse(
        Long id,
        Long productId,
        String productName,
        String sku,
        Integer quantity,
        BigDecimal unitPrice,
        Integer availableStock
) {
}