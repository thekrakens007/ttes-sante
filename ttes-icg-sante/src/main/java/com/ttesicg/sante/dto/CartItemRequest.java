package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CartItemRequest {

    private Long productId;

    private Long bundleId;

    /**
     * Identifiant de la cure à ajouter au panier.
     */
    private Long cureId;

    @NotNull
    @Positive
    private Integer quantity;
}