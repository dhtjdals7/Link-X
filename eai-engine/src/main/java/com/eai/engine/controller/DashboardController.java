package com.eai.engine.controller;

import com.eai.engine.dto.DashboardDTO; // <-- DTO 경로도 여기로 맞춰야 함
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Random;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final Random random = new Random();
    private long accumulatedTotal = 15000;

    @GetMapping("/summary")
    public DashboardDTO getDashboardSummary() {
        int currentBatch = random.nextInt(100);
        int errors = random.nextInt(5);

        accumulatedTotal += currentBatch;
        long success = accumulatedTotal - (errors * 10);

        double tps = 30 + (50 * random.nextDouble());

        return new DashboardDTO(
                accumulatedTotal,
                success,
                errors * 50L,
                Math.floor(tps * 10) / 10.0
        );
    }
}