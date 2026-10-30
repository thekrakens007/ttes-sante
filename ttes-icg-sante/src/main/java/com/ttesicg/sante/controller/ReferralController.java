package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.ReferralSummaryResponse;
import com.ttesicg.sante.service.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/referral")
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    @GetMapping("/me")
    public ReferralSummaryResponse me(Authentication authentication) {
        return referralService.getSummary(authentication.getName());
    }
}
