package com.ttesicg.sante.dto;

public record BundleImageResponse(

        Long id,

        String imageUrl,

        boolean main,

        Integer displayOrder
) {
}