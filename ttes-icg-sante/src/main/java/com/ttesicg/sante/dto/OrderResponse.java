package com.ttesicg.sante.dto;


import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;


@Data
@Builder
public class OrderResponse {


    private Long id;


    private String status;


    private BigDecimal totalAmount;


    private String customerName;


    private String customerPhone;


    private String customerEmail;

    private String deliveryAddress;

    private String customerNote;

    private String whatsappLink;


    private List<OrderItemResponse> items;


}