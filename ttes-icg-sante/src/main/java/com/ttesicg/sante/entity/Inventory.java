package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "product_id",
            nullable = false,
            unique = true
    )
    private Product product;



    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 0;



    @Builder.Default
    @Column(name = "minimum_quantity", nullable = false)
    private Integer minimumQuantity = 0;



    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;



    @PrePersist
    @PreUpdate
    protected void updateTimestamp() {

        updatedAt = LocalDateTime.now();

    }

}