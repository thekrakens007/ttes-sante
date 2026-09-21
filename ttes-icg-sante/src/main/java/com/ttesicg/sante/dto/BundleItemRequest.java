package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BundleItemRequest(

        @NotNull
        Long productId,

        @NotNull
        @Positive
        Integer quantity
) {
}