package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CompanyRequest;
import com.ttesicg.sante.dto.CompanyResponse;
import com.ttesicg.sante.entity.Company;
import com.ttesicg.sante.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {


    private final CompanyRepository companyRepository;



    public CompanyResponse update(
            Long id,
            CompanyRequest request
    ){

        Company company =
                companyRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );

        company.setName(
                request.getName()
        );

        company.setDescription(
                request.getDescription()
        );

        company.setCountry(
                request.getCountry()
        );

        company.setWebsite(
                request.getWebsite()
        );

        companyRepository.save(company);

        return map(company);

    }

    public CompanyResponse create(
            CompanyRequest request
    ){

        Company company = Company.builder()
                .name(request.getName())
                .description(request.getDescription())
                .country(request.getCountry())
                .website(request.getWebsite())
                .build();


        Company saved =
                companyRepository.save(company);


        return map(saved);
    }


    public List<CompanyResponse> findAll(){

        return companyRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    public CompanyResponse findById(Long id){

        Company company =
                companyRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );


        return map(company);
    }



    public void delete(Long id){

        companyRepository.deleteById(id);
    }



    private CompanyResponse map(
            Company company
    ){

        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .description(company.getDescription())
                .country(company.getCountry())
                .website(company.getWebsite())
                .build();
    }
}