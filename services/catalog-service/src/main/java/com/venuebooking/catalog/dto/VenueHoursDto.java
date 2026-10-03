package com.venuebooking.catalog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VenueHoursDto {

    @NotNull
    @Min(1)
    @Max(7)
    private Integer dayOfWeek; // 1=Mon ... 7=Sun

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    private LocalTime openTime;

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    private LocalTime closeTime;

    @Builder.Default
    private Boolean closesNextDay = false;
}
