package com.ttesicg.sante.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "order_id",
            nullable = false
    )
    @JsonIgnore
    private Order order;

    /*
     * Produit commandé.
     *
     * NULL si cette ligne correspond à un pack.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /*
     * Pack commandé.
     *
     * NULL si cette ligne correspond à un produit.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id")
    private ProductBundle bundle;

    @Column(nullable = false)
    private Integer quantity;

    /*
     * Prix enregistré au moment de la commande.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}