package com.eai.engine.server;

import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ChannelHandler.Sharable
public class MciHandler extends SimpleChannelInboundHandler<String> {

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        log.info("✅ New Client Connected: {}", ctx.channel().remoteAddress());
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) {
        log.info("📩 [RECV] 전문 수신: {}", msg);

        // 1. 전문 파싱 (나중에 여기에 헤더/바디 분리 로직 들어감)
        // 예: IF-MCI-00120260130...

        // 2. 응답 전문 생성 (Echo)
        String response = "[ACK] 정상 처리되었습니다. (Recv: " + msg.length() + " bytes)";

        // 3. 클라이언트로 응답 전송
        ctx.writeAndFlush(response);
        log.info("📤 [SEND] 응답 전송 완료");
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.error("통신 에러 발생", cause);
        ctx.close();
    }
}