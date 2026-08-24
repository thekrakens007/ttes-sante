package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.TherapeuticAreaRequest;
import com.ttesicg.sante.dto.TherapeuticAreaResponse;
import com.ttesicg.sante.entity.TherapeuticArea;
import com.ttesicg.sante.repository.TherapeuticAreaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;


import java.util.List;


@Service
@RequiredArgsConstructor
public class TherapeuticAreaService {


    private final TherapeuticAreaRepository repository;


    public TherapeuticAreaResponse findById(
            Long id
    ){

        TherapeuticArea area =
                repository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Domaine thérapeutique introuvable"
                                )
                        );

        return map(area);
    }

    public TherapeuticAreaResponse update(
            Long id,
            TherapeuticAreaRequest request
    ){

        TherapeuticArea area =
                repository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Domaine thérapeutique introuvable"
                                )
                        );

        area.setName(request.getName());
        area.setDescription(request.getDescription());

        repository.save(area);

        return map(area);
    }
    public void delete(Long id){

        repository.deleteById(id);

    }
    public TherapeuticAreaResponse create(
            TherapeuticAreaRequest request
    ){


        TherapeuticArea area =
                TherapeuticArea.builder()

                        .name(request.getName())

                        .description(request.getDescription())

                        .active(true)

                        .build();


        repository.save(area);


        return map(area);
    }



    public List<TherapeuticAreaResponse> findAll(){


        return repository.findAll()
                .stream()
                .map(this::map)
                .toList();

    }



    private TherapeuticAreaResponse map(
            TherapeuticArea area
    ){

        return TherapeuticAreaResponse.builder()

                .id(area.getId())

                .name(area.getName())

                .description(area.getDescription())

                .active(area.getActive())

                .build();

    }

}