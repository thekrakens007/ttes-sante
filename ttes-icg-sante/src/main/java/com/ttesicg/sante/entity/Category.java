package com.ttesicg.sante.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false)
    private String name;


    @Column(columnDefinition = "TEXT")
    private String description;


    @Column(name = "image_url", length = 500)
    private String imageUrl;


    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parent;


    @Column(nullable = false)
    private Boolean active = true;


    @Column(name = "created_at")
    private LocalDateTime createdAt;


    @Column(name = "updated_at")
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