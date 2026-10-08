package com.ttesicg.sante.dto;

import java.util.List;

public record GlobalSearchResponse(
        List<ProductResponse> products,
        List<BundleResponse> bundles
) {
}
