
package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.CureRequest;
import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.service.CureService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cures")
@RequiredArgsConstructor
public class AdminCureController {

    private final CureService cureService;

    @GetMapping
    public List<CureResponse> getAll() {
        return cureService.findAllForAdmin();
    }

    @GetMapping("/{id}")
    public CureResponse getOne(@PathVariable Long id) {
        return cureService.findForAdmin(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CureResponse create(
            @Valid @RequestBody CureRequest request
    ) {
        return cureService.create(request);
    }

    @PutMapping("/{id}")
    public CureResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CureRequest request
    ) {
        return cureService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        cureService.delete(id);
    }
}
