
package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.service.CureService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cures")
@RequiredArgsConstructor
public class CureController {

    private final CureService cureService;

    @GetMapping
    public List<CureResponse> getCures() {
        return cureService.findPublicCures();
    }

    @GetMapping("/{id}")
    public CureResponse getCure(@PathVariable Long id) {
        return cureService.findPublicCure(id);
    }
}
