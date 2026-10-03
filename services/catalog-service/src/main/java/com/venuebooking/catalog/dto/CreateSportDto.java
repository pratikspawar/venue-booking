package com.venuebooking.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSportDto {

    @NotBlank(message = "Sport code is required")
    private String code; // e.g. BADMINTON, PICKLEBALL, VR_GAMING, BOWLING, SQUASH

    @NotBlank(message = "English name is required")
    private String nameEn;

    private String nameMr;

    private String nameHi;
}
