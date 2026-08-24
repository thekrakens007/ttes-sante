package com.ttesicg.sante.dto;


import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class InventoryResponse {


    private Long id;

    private Long productId;

    private String productName;

    private Integer quantity;

    private Integer minimumQuantity;

    private Boolean available;

}