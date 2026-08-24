package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.TherapeuticAreaRequest;
import com.ttesicg.sante.dto.TherapeuticAreaResponse;
import com.ttesicg.sante.service.TherapeuticAreaService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/admin/therapeutic-areas")
@RequiredArgsConstructor
public class AdminTherapeuticAreaController {


    private final TherapeuticAreaService service;



    @PostMapping
    public TherapeuticAreaResponse create(
            @Valid @RequestBody TherapeuticAreaRequest request
    ){

        return service.create(request);

    }

    @GetMapping("/{id}")
    public TherapeuticAreaResponse findById(
            @PathVariable Long id
    ){
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public TherapeuticAreaResponse update(
            @PathVariable Long id,
            @Valid @RequestBody TherapeuticAreaRequest request
    ){
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ){
        service.delete(id);
    }


    @GetMapping
    public List<TherapeuticAreaResponse> findAll(){

        return service.findAll();

    }

}