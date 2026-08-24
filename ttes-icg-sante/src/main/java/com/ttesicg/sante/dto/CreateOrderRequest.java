package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrderRequest {

    @NotBlank(message = "L'adresse de livraison est obligatoire")
    private String deliveryAddress;

    private String customerNote;
}