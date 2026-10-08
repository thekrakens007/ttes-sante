package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.dto.ProductResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private final ProductService productService;
    private final ProductBundleService productBundleService;


    // =========================================================
    // RECHERCHE GLOBALE
    // =========================================================

    public GlobalSearchResponse search(
            String keyword,
            int page,
            int size
    ) {

        String normalizedKeyword =
                keyword != null
                        ? keyword.trim()
                        : "";


        if (normalizedKeyword.isEmpty()) {

            return new GlobalSearchResponse(
                    List.of(),
                    List.of()
            );
        }


        // =====================================================
        // PRODUITS
        // =====================================================

        PageRequest pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );

        List<ProductResponse> products =
                productService
                        .searchAvailableProductsPaginated(
                                normalizedKeyword,
                                pageable
                        )
                        .getContent();


        // =====================================================
        // PACKS
        // =====================================================

        String search =
                normalizedKeyword.toLowerCase(
                        Locale.ROOT
                );


        List<BundleResponse> bundles =
                productBundleService
                        .findAllActive()
                        .stream()
                        .filter(bundle -> {

                            String name =
                                    bundle.name() != null
                                            ? bundle.name().toLowerCase(
                                                    Locale.ROOT
                                            )
                                            : "";

                            String description =
                                    bundle.description() != null
                                            ? bundle.description().toLowerCase(
                                                    Locale.ROOT
                                            )
                                            : "";

                            return name.contains(search)
                                    || description.contains(search);
                        })
                        .toList();


        return new GlobalSearchResponse(
                products,
                bundles
        );
    }
}
