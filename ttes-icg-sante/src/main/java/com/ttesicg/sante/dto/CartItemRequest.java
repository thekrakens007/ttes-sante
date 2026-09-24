package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CartItemRequest {

    private Long productId;

    private Long bundleId;

    @NotNull
    @Positive
    private Integer quantity;
}