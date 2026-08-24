package com.ttesicg.sante.dto;


import lombok.Builder;
import lombok.Data;


import java.math.BigDecimal;


@Data
@Builder
public class CartItemResponse {


    private Long id;


    private Long productId;


    private String productName;


    private Integer quantity;


    private BigDecimal price;


    private BigDecimal subtotal;


}