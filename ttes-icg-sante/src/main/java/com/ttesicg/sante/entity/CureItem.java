
package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "cure_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_cure_product",
                columnNames = {"cure_id", "product_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class CureItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cure_id", nullable = false)
    private Cure cure;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;
}
