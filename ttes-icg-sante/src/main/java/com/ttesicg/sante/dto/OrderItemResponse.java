package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private Long bundleId;

    private String bundleName;

    private Integer quantity;

    private BigDecimal price;
}