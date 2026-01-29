package com.eai.engine.route;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component // 스프링이 이 파일을 자동으로 읽어서 실행시킵니다.
public class FileRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        // 시나리오: data/input 폴더에 파일이 들어오면 -> data/output 폴더로 이동시킨다.
        from("file:data/input?delete=true") // 1. data/input 폴더 감시 (처리 후 원본 삭제)
                .routeId("File-Move-Route")     // 2. 라우트 이름 부여 (로그 식별용)
                .log("📂 [EAI 감지] 파일이 들어왔습니다: ${header.CamelFileName}") // 3. 로그 찍기
                .to("file:data/output");        // 4. data/output 폴더로 이동
    }
}