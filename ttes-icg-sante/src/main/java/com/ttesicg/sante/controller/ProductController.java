package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }


    
@GetMapping("/paginated")
public Page<ProductResponse> getProductsPaginated(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size
) {

    Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            )
    );

    return productService.getAvailableProductsPaginated(
            pageable
    );
}
    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @GetMapping("/search")
public Page<ProductResponse> searchProducts(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size
) {

    Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            )
    );

    return productService.searchAvailableProductsPaginated(
            keyword,
            pageable
    );
}
    @GetMapping("/company/{companyId}")
    public List<ProductResponse> getProductsByCompany(
            @PathVariable Long companyId
    ) {
        return productService.getProductsByCompany(companyId);
    }


}
