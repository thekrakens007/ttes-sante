package com.ttesicg.sante.controller;

import com.ttesicg.sante.entity.ReferralTier;
import com.ttesicg.sante.repository.ReferralTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/referral-tiers")
@RequiredArgsConstructor
public class AdminReferralTierController {

    private final ReferralTierRepository repository;

    @GetMapping
    public List<ReferralTier> list() {
        return repository.findAll().stream()
                .sorted(java.util.Comparator
                        .comparing(ReferralTier::getGauge)
                        .thenComparing(ReferralTier::getThreshold))
                .toList();
    }

    @PostMapping
    public ReferralTier create(@RequestBody ReferralTier tier) {
        validate(tier);
        tier.setId(null);
        return repository.save(tier);
    }

    @PutMapping("/{id}")
    public ReferralTier update(@PathVariable Long id, @RequestBody ReferralTier body) {
        validate(body);
        ReferralTier tier = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Palier introuvable"));
        tier.setGauge(body.getGauge());
        tier.setLevel(body.getLevel());
        tier.setThreshold(body.getThreshold());
        tier.setRewardLabel(body.getRewardLabel());
        return repository.save(tier);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    private void validate(ReferralTier t) {
        if (!"SIGNUP".equals(t.getGauge()) && !"PURCHASE".equals(t.getGauge())) {
            throw new RuntimeException("Jauge invalide (SIGNUP ou PURCHASE)");
        }
        if (t.getLevel() == null || t.getThreshold() == null || t.getThreshold() <= 0
                || t.getRewardLabel() == null || t.getRewardLabel().isBlank()) {
            throw new RuntimeException("Niveau, seuil et récompense sont obligatoires");
        }
    }
}
