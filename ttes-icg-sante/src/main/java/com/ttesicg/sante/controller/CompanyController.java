package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CompanyResponse;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;


    // =========================================================
    // LISTE DES ENTREPRISES
    // =========================================================

    @GetMapping
    public List<CompanyResponse> findAll() {

        return companyService.findAll();
    }


    // =========================================================
    // DETAIL D'UNE ENTREPRISE
    // =========================================================

    @GetMapping("/{id}")
    public CompanyResponse findById(
            @PathVariable Long id
    ) {

        return companyService.findById(id);
    }


    // =========================================================
    // PRODUITS D'UNE ENTREPRISE
    // =========================================================

    @GetMapping("/{id}/products")
    public List<ProductResponse> findProducts(
            @PathVariable Long id
    ) {

        return companyService.findProducts(id);
    }
}