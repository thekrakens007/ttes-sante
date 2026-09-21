package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bundle_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BundleImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "bundle_id",
            nullable = false
    )
    private ProductBundle bundle;

    @Column(
            name = "image_url",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String imageUrl;

    @Builder.Default
    @Column(
            name = "is_main",
            nullable = false
    )
    private Boolean main = false;

    @Builder.Default
    @Column(
            name = "display_order",
            nullable = false
    )
    private Integer displayOrder = 0;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
    }
}