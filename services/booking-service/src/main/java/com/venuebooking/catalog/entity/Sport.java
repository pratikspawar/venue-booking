package com.venuebooking.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code; // PLAYSTATION, POOL, CARROM, TURF, TENNIS

    @Column(name = "name_en", nullable = false, length = 80)
    private String nameEn;

    @Column(name = "name_mr", length = 80)
    private String nameMr;

    @Column(name = "name_hi", length = 80)
    private String nameHi;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
