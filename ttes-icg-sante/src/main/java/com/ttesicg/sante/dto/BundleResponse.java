package com.ttesicg.sante.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BundleResponse(

        Long id,

        String name,

        String description,

        BigDecimal price,

        Boolean active,

        Integer stock,

        List<BundleItemResponse> items,

        List<BundleImageResponse> images,

        LocalDateTime createdAt,

        LocalDateTime updatedAt
) {
}