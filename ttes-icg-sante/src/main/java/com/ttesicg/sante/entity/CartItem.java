package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cart_product",
                        columnNames = {"cart_id", "product_id"}
                ),
                @UniqueConstraint(
                        name = "uk_cart_bundle",
                        columnNames = {"cart_id", "bundle_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "cart_id",
            nullable = false
    )
    private Cart cart;

    /*
     * Produit du panier.
     *
     * NULL si l'article est un pack.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /*
     * Pack du panier.
     *
     * NULL si l'article est un produit.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id")
    private ProductBundle bundle;

    @Column(nullable = false)
    private Integer quantity;

    /*
     * Prix enregistré au moment de l'ajout
     * dans le panier.
     *
     * Cela permet de conserver le prix historique.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}