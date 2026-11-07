package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CureRequest;
import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.entity.Cure;
import com.ttesicg.sante.repository.CureRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CureService {

    private final CureRepository cureRepository;

    /*
     * ============================================================
     * CATALOGUE PUBLIC
     * ============================================================
     */

    @Transactional(readOnly = true)
    public Page<CureResponse> findPublicCures(Pageable pageable) {

        return cureRepository.findByActiveTrue(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CureResponse findPublicCure(Long id) {

        Cure cure = cureRepository.findById(id)
                .filter(Cure::isActive)
                .orElseThrow(() ->
                        new EntityNotFoundException("Cure introuvable")
                );

        return toResponse(cure);
    }

    /*
     * ============================================================
     * ADMINISTRATION
     * ============================================================
     */

    @Transactional(readOnly = true)
    public Page<CureResponse> findAllForAdmin(Pageable pageable) {

        return cureRepository.findAll(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CureResponse findForAdmin(Long id) {

        return toResponse(getCure(id));
    }

    /*
     * ============================================================
     * CREATION
     * ============================================================
     */

    public CureResponse create(CureRequest request) {

        Cure cure = new Cure();

        applyRequest(cure, request);

        return toResponse(cureRepository.save(cure));
    }

    /*
     * ============================================================
     * MODIFICATION
     * ============================================================
     */

    public CureResponse update(Long id, CureRequest request) {

        Cure cure = getCure(id);

        applyRequest(cure, request);

        return toResponse(cureRepository.save(cure));
    }

    /*
     * ============================================================
     * SUPPRESSION LOGIQUE
     * ============================================================
     *
     * Une cure peut être référencée dans order_items.
     * On la désactive au lieu de la supprimer physiquement.
     */

    public void delete(Long id) {

        Cure cure = getCure(id);

        cure.setActive(false);

        cureRepository.save(cure);
    }

    /*
     * ============================================================
     * RECHERCHE
     * ============================================================
     */

    private Cure getCure(Long id) {

        return cureRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Cure introuvable")
                );
    }

    /*
     * ============================================================
     * APPLICATION DES DONNÉES
     * ============================================================
     */

    private void applyRequest(Cure cure, CureRequest request) {

        cure.setName(request.name().trim());

        cure.setDescription(request.description());

        cure.setImageUrl(request.imageUrl());

        cure.setType(request.type());

        cure.setPrice(request.price());

        // Si active est absent lors d'une modification,
        // conserver le statut actuel.
        if (request.active() != null) {
            cure.setActive(request.active());
        }
    }

    /*
     * ============================================================
     * CONVERSION DTO
     * ============================================================
     */

    private CureResponse toResponse(Cure cure) {

        return new CureResponse(
                cure.getId(),
                cure.getName(),
                cure.getDescription(),
                cure.getImageUrl(),
                cure.getType(),
                cure.getPrice(),
                cure.isActive(),
                cure.getCreatedAt(),
                cure.getUpdatedAt()
        );
    }
}