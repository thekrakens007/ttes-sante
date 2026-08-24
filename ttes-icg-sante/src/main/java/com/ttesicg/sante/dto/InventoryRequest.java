package com.ttesicg.sante.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;


@Data
public class InventoryRequest {


    @Min(value = 0, message = "La quantité ne peut pas être négative")
    private Integer quantity;


    @Min(value = 0, message = "Le minimum ne peut pas être négatif")
    private Integer minimumQuantity;

}