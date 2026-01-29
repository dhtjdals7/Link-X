package com.eai.engine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardDTO {
    private long totalCount;    // 총 거래량
    private long successCount;  // 성공 건수
    private long failCount;     // 실패 건수
    private double tps;         // 초당 처리 건수 (TPS)
}