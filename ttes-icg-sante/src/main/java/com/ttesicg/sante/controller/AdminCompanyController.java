package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CompanyRequest;
import com.ttesicg.sante.dto.CompanyResponse;
import com.ttesicg.sante.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/admin/companies")
@RequiredArgsConstructor
public class AdminCompanyController {


    private final CompanyService companyService;



    @PostMapping
    public CompanyResponse create(
            @Valid @RequestBody CompanyRequest request
    ){
        System.out.println("yoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        return companyService.create(request);
    }


    @PutMapping("/{id}")
    public CompanyResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CompanyRequest request
    ){
        return companyService.update(id, request);
    }

    @GetMapping
    public List<CompanyResponse> findAll(){

        return companyService.findAll();
    }



    @GetMapping("/{id}")
    public CompanyResponse findById(
            @PathVariable Long id
    ){

        return companyService.findById(id);
    }



    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ){

        companyService.delete(id);
    }
}