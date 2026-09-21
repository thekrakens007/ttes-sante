package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotBlank;

public record BundleImageRequest(

        @NotBlank
        String imageUrl,

        boolean main,

        Integer displayOrder
) {
}