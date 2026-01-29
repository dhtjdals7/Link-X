package com.eai.engine.server;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class NettyServer {

    private static final int PORT = 9001; // MCI 수신 포트
    private final MciHandler mciHandler; // 비즈니스 로직 처리기

    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;

    @PostConstruct
    public void start() {
        new Thread(() -> {
            bossGroup = new NioEventLoopGroup(1);
            workerGroup = new NioEventLoopGroup();

            try {
                ServerBootstrap b = new ServerBootstrap();
                b.group(bossGroup, workerGroup)
                        .channel(NioServerSocketChannel.class)
                        .childHandler(new ChannelInitializer<SocketChannel>() {
                            @Override
                            protected void initChannel(SocketChannel ch) {
                                // 파이프라인 구성 (금융권은 보통 바이트 그대로 쓰지만, 테스트용으로 String 변환기 추가)
                                ch.pipeline().addLast(new StringDecoder(StandardCharsets.UTF_8));
                                ch.pipeline().addLast(new StringEncoder(StandardCharsets.UTF_8));
                                ch.pipeline().addLast(mciHandler); // 여기가 핵심 로직
                            }
                        });

                ChannelFuture f = b.bind(PORT).sync();
                log.info("🚀 [HANA EAI] MCI Socket Server Started on Port: {}", PORT);
                f.channel().closeFuture().sync();
            } catch (InterruptedException e) {
                log.error("Socket Server Interrupted", e);
            }
        }).start();
    }

    @PreDestroy
    public void stop() {
        if (bossGroup != null) bossGroup.shutdownGracefully();
        if (workerGroup != null) workerGroup.shutdownGracefully();
        log.info("🛑 [HANA EAI] Socket Server Stopped.");
    }
}