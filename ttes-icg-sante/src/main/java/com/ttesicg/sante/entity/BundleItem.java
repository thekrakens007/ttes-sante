package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "bundle_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_bundle_product",
                        columnNames = {
                                "bundle_id",
                                "product_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BundleItem {

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

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "product_id",
            nullable = false
    )
    private Product product;

    @Column(nullable = false)
    private Integer quantity;
}