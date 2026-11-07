package com.ttesicg.sante.dto;

import com.ttesicg.sante.entity.CureType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CureRequest(

        @NotBlank
        @Size(max = 180)
        String name,

        @Size(max = 10000)
        String description,

        @Size(max = 1000)
        String imageUrl,

        @NotNull
        CureType type,

        @NotNull
        @DecimalMin(value = "0.00")
        @Digits(integer = 10, fraction = 2)
        BigDecimal price,

        Boolean active
) {}