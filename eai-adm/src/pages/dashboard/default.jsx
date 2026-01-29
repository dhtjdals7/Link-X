import { useEffect, useState } from 'react';

// material-ui
import { Grid, Typography } from '@mui/material';

// project import (경로는 템플릿 버전에 따라 다를 수 있으나 보통 맞습니다)
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MainCard from 'components/MainCard';

// axios 추가
import axios from 'axios';

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  
  // 1. 상태(State) 변수 선언: 화면에 뿌려줄 데이터들
  // Java의 Member Variable과 비슷합니다. 값이 바뀌면 화면이 자동으로 다시 그려집니다.
  const [stats, setStats] = useState({
    totalCount: 0,      // 총 거래 건수
    successCount: 0,    // 성공 건수
    failCount: 0,       // 실패 건수
    tps: 0              // 초당 처리 건수
  });

  // 2. 서버 통신 함수 (Spring Boot 호출)
  const fetchDashboardData = () => {
    // 백엔드 API 주소 (나중에 만들 Controller 주소)
    axios.get('http://localhost:8080/api/dashboard/summary')
      .then((response) => {
        // 성공 시: 받아온 데이터를 상태 변수에 넣음
        console.log("서버 응답:", response.data);
        setStats(response.data); 
      })
      .catch((error) => {
        // 실패 시: 일단 콘솔에 에러 찍기 (서버 안 켜져 있으면 에러 남)
        console.error("데이터 가져오기 실패:", error);
      });
  };

  // 3. 화면이 켜질 때 실행 (Java의 @PostConstruct 역할)
  useEffect(() => {
    fetchDashboardData(); // 처음에 한 번 실행

    // 5초마다 데이터 갱신 (Polling) -> 실시간 모니터링 효과
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval); // 화면 꺼질 때 타이머 종료
  }, []);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      
      {/* 헤더 타이틀 */}
      <Grid item xs={12} sx={{ mb: -2.25 }}>
        <Typography variant="h5">OFIS 실시간 모니터링</Typography>
      </Grid>

      {/* 카드 1: 총 거래 건수 */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce 
          title="총 거래량 (Total Tx)" 
          count={stats.totalCount.toLocaleString()} 
          percentage={59.3} 
          extra="오늘 누적" 
        />
      </Grid>

      {/* 카드 2: 처리 속도 (TPS) */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce 
          title="실시간 TPS" 
          count={stats.tps} 
          percentage={70.5} 
          color="primary" // 파란색
          extra="건/초" 
        />
      </Grid>

      {/* 카드 3: 에러 건수 (빨간색 강조) */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce 
          title="에러 발생 (Fail)" 
          count={stats.failCount} 
          percentage={27.4} 
          isLoss // 빨간색 화살표 표시
          color="warning" 
          extra="조치 필요" 
        />
      </Grid>

      {/* 카드 4: 성공 건수 */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce 
          title="정상 처리 (Success)" 
          count={stats.successCount.toLocaleString()} 
          percentage={27.4} 
          isLoss={false} 
          color="success" 
          extra="건" 
        />
      </Grid>

      {/* 하단 영역: 그래프 들어갈 자리 (일단 빈 카드) */}
      <Grid item md={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />
      <Grid item xs={12} md={7} lg={8}>
        <MainCard content={false} sx={{ mt: 1.5 }}>
            <div style={{ padding: '20px' }}>
                <Typography variant="h6">시간대별 트랜잭션 추이 (개발 예정)</Typography>
                {/* 나중에 여기에 차트 넣을 예정 */}
            </div>
        </MainCard>
      </Grid>
    </Grid>
  );
}