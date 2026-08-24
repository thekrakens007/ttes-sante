package com.ttesicg.sante.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    /**
     * Entreprise qui fabrique ou fournit le produit
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "company_id",
            nullable = false
    )
    private Company company;



    @Column(
            nullable = false,
            length = 255
    )
    private String name;



    @Column(
            nullable = false,
            unique = true,
            length = 100
    )
    private String sku;



    @Column(columnDefinition = "TEXT")
    private String description;



    @Column(length = 255)
    private String brand;



    @Column(
            name = "active_ingredient",
            length = 500
    )
    private String activeIngredient;



    @Column(length = 100)
    private String dosage;



    /**
     * Exemple:
     * comprimé
     * sirop
     * crème
     * injection
     */
    @Column(length = 100)
    private String form;



    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal price;



    @Column(
            name = "requires_prescription",
            nullable = false
    )
    @Builder.Default
    private Boolean requiresPrescription = false;



    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;




    /**
     * Catégories du produit
     *
     * Exemple:
     * Médicament
     *  └── Douleur
     *       └── Antalgique
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_categories",

            joinColumns =
            @JoinColumn(
                    name = "product_id"
            ),

            inverseJoinColumns =
            @JoinColumn(
                    name = "category_id"
            )
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();




    /**
     * Domaines thérapeutiques
     *
     * Exemple:
     * Cardiologie
     * Diabète
     * Douleur
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_therapeutic_areas",

            joinColumns =
            @JoinColumn(
                    name = "product_id"
            ),

            inverseJoinColumns =
            @JoinColumn(
                    name = "therapeutic_area_id"
            )
    )
    @Builder.Default
    private Set<TherapeuticArea> therapeuticAreas = new HashSet<>();

    @OneToOne(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Inventory inventory;

    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<ProductImage> images = new HashSet<>();




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
    protected void onCreate(){

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }




    @PreUpdate
    protected void onUpdate(){

        updatedAt = LocalDateTime.now();
    }

}