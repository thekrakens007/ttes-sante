package com.ttesicg.sante.dto;


import lombok.Builder;
import lombok.Data;


import java.math.BigDecimal;
import java.util.List;


@Data
@Builder
public class CartResponse {


    private Long id;


    private List<CartItemResponse> items;


    private BigDecimal total;


}