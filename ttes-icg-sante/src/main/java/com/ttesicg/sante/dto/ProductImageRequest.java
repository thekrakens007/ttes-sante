package com.ttesicg.sante.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class ProductImageRequest {


    @NotBlank(message = "L'URL de l'image est obligatoire")
    private String imageUrl;


    private Boolean main = false;


    private Integer displayOrder = 0;

}