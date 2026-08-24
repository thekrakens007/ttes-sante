package com.ttesicg.sante.dto;


import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class ProductImageResponse {


    private Long id;


    private String imageUrl;


    private Boolean main;


    private Integer displayOrder;

}