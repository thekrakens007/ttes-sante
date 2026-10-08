package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.service.GlobalSearchService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;


    @GetMapping
    public ResponseEntity<GlobalSearchResponse> search(

            @RequestParam(
                    defaultValue = ""
            )
            String q,

            @RequestParam(
                    defaultValue = "0"
            )
            int page,

            @RequestParam(
                    defaultValue = "8"
            )
            int size,

            @RequestParam(
                    required = false
            )
            Long categoryId,

            @RequestParam(
                    required = false
            )
            Long companyId,

            @RequestParam(
                    required = false
            )
            Long therapeuticAreaId

    ) {

        return ResponseEntity.ok(
                globalSearchService.search(
                        q,
                        page,
                        size,
                        categoryId,
                        companyId,
                        therapeuticAreaId
                )
        );
    }
}
