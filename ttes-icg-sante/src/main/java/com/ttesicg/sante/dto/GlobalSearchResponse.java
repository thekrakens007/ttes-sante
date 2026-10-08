package com.ttesicg.sante.dto;

import java.util.List;

public record GlobalSearchResponse(

        List<ProductResponse> products,

        List<BundleResponse> bundles,

        int page,

        int size,

        long totalProducts,

        long totalBundles,

        int totalProductPages,

        int totalBundlePages

) {
}
