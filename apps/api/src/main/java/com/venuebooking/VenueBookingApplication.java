package com.venuebooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class VenueBookingApplication {

    public static void main(String[] args) {
        // Enforce UTC timezone across all application layers
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(VenueBookingApplication.class, args);
    }
}
