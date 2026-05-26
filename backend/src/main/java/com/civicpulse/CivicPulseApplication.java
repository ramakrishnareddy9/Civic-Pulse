package com.civicpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class CivicPulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicPulseApplication.class, args);
    }
}
