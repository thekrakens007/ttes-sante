package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_bundles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBundle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(
            mappedBy = "bundle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<BundleItem> items = new ArrayList<>();

    @OneToMany(
            mappedBy = "bundle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<BundleImage> images = new ArrayList<>();

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }
}