package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private Boolean enabled;

    private List<String> roles;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}