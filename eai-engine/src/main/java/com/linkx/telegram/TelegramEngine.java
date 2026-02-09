package com.linkx.telegram;

import com.linkx.domain.TelegramLayout;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.Charset;
import java.util.*;

/**
 * Fixed-Length 전문 파서/빌더 엔진
 * - DB 메타데이터 기반으로 전문 조립/파싱
 * - EUC-KR / UTF-8 인코딩 지원
 * - 한글 바이트 처리 (EUC-KR: 2byte, UTF-8: 3byte)
 */
@Slf4j
@Component
public class TelegramEngine {

    private static final Charset DEFAULT_CHARSET = Charset.forName("EUC-KR");

    /**
     * 전문 조립 (Map → Fixed-length byte[])
     */
    public byte[] build(List<TelegramLayout> layouts, Map<String, String> fieldValues, String charsetName) {
        Charset charset = resolveCharset(charsetName);
        int totalLength = layouts.stream().mapToInt(TelegramLayout::getFieldLength).sum();
        byte[] result = new byte[totalLength];
        // 공백으로 초기화
        Arrays.fill(result, (byte) 0x20);

        int offset = 0;
        for (TelegramLayout layout : layouts) {
            String value = fieldValues.getOrDefault(layout.getFieldName(), "");

            // 기본값 적용
            if (value.isEmpty() && layout.getDefaultValue() != null) {
                value = layout.getDefaultValue();
            }

            byte[] fieldBytes = packField(value, layout, charset);
            System.arraycopy(fieldBytes, 0, result, offset, layout.getFieldLength());
            offset += layout.getFieldLength();
        }

        return result;
    }

    /**
     * 전문 파싱 (byte[] → Map)
     */
    public Map<String, Object> parse(byte[] rawData, List<TelegramLayout> layouts, String charsetName) {
        Charset charset = resolveCharset(charsetName);
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> fields = new ArrayList<>();

        int offset = 0;
        for (TelegramLayout layout : layouts) {
            if (offset + layout.getFieldLength() > rawData.length) {
                log.warn("전문 길이 부족: offset={}, fieldLength={}, rawLength={}",
                        offset, layout.getFieldLength(), rawData.length);
                break;
            }

            byte[] fieldBytes = Arrays.copyOfRange(rawData, offset, offset + layout.getFieldLength());
            String rawValue = new String(fieldBytes, charset);
            String trimmedValue = trimField(rawValue, layout);

            Map<String, Object> fieldInfo = new LinkedHashMap<>();
            fieldInfo.put("fieldName", layout.getFieldName());
            fieldInfo.put("fieldNameKr", layout.getFieldNameKr());
            fieldInfo.put("rawValue", rawValue);
            fieldInfo.put("value", trimmedValue);
            fieldInfo.put("offset", offset);
            fieldInfo.put("length", layout.getFieldLength());
            fieldInfo.put("dataType", layout.getDataType());
            fieldInfo.put("section", layout.getSection());

            fields.add(fieldInfo);
            offset += layout.getFieldLength();
        }

        result.put("fields", fields);
        result.put("totalParsedLength", offset);
        result.put("rawDataLength", rawData.length);
        result.put("charset", charset.name());

        return result;
    }

    /**
     * 전문 유효성 검사
     */
    public List<String> validate(List<TelegramLayout> layouts, Map<String, String> fieldValues) {
        List<String> errors = new ArrayList<>();

        for (TelegramLayout layout : layouts) {
            String value = fieldValues.getOrDefault(layout.getFieldName(), "");

            // 필수값 체크
            if (Boolean.TRUE.equals(layout.getRequired()) && value.isEmpty()
                    && layout.getDefaultValue() == null) {
                errors.add(String.format("[%s] %s 필드는 필수입니다.",
                        layout.getFieldName(), layout.getFieldNameKr()));
            }

            // 숫자 타입 체크
            if ("NUMBER".equals(layout.getDataType()) && !value.isEmpty()) {
                if (!value.matches("^-?\\d*\\.?\\d+$")) {
                    errors.add(String.format("[%s] %s 필드는 숫자만 입력 가능합니다.",
                            layout.getFieldName(), layout.getFieldNameKr()));
                }
            }

            // 길이 초과 체크
            if (!value.isEmpty()) {
                Charset charset = DEFAULT_CHARSET;
                int byteLength = value.getBytes(charset).length;
                if (byteLength > layout.getFieldLength()) {
                    errors.add(String.format("[%s] %s 필드 길이 초과 (%d > %d bytes)",
                            layout.getFieldName(), layout.getFieldNameKr(),
                            byteLength, layout.getFieldLength()));
                }
            }
        }

        return errors;
    }

    /**
     * 전문 전체 길이 계산
     */
    public int calculateTotalLength(List<TelegramLayout> layouts) {
        return layouts.stream().mapToInt(TelegramLayout::getFieldLength).sum();
    }

    /**
     * Hex dump 생성 (디버깅용)
     */
    public String toHexDump(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < data.length; i++) {
            if (i > 0 && i % 16 == 0) sb.append("\n");
            else if (i > 0 && i % 8 == 0) sb.append("  ");
            sb.append(String.format("%02X ", data[i]));
        }
        return sb.toString().trim();
    }

    // ── Private Methods ──

    private byte[] packField(String value, TelegramLayout layout, Charset charset) {
        byte[] result = new byte[layout.getFieldLength()];
        char padChar = (layout.getPadChar() != null && !layout.getPadChar().isEmpty())
                ? layout.getPadChar().charAt(0) : ' ';
        Arrays.fill(result, (byte) padChar);

        if (value == null || value.isEmpty()) {
            // 숫자 타입은 0 패딩
            if ("NUMBER".equals(layout.getDataType())) {
                Arrays.fill(result, (byte) '0');
            }
            return result;
        }

        byte[] valueBytes = value.getBytes(charset);
        int copyLength = Math.min(valueBytes.length, layout.getFieldLength());

        if ("RIGHT".equals(layout.getAlign())) {
            // 우측정렬 (숫자)
            System.arraycopy(valueBytes, 0, result,
                    layout.getFieldLength() - copyLength, copyLength);
        } else {
            // 좌측정렬 (문자)
            System.arraycopy(valueBytes, 0, result, 0, copyLength);
        }

        return result;
    }

    private String trimField(String rawValue, TelegramLayout layout) {
        if (rawValue == null) return "";

        if ("RIGHT".equals(layout.getAlign()) || "NUMBER".equals(layout.getDataType())) {
            // 숫자: 왼쪽 0/공백 제거
            return rawValue.replaceAll("^[0 ]+", "");
        } else {
            // 문자: 오른쪽 공백 제거
            return rawValue.replaceAll("\\s+$", "");
        }
    }

    private Charset resolveCharset(String charsetName) {
        if (charsetName == null || charsetName.isEmpty()) {
            return DEFAULT_CHARSET;
        }
        try {
            return Charset.forName(charsetName);
        } catch (Exception e) {
            log.warn("Unsupported charset: {}, falling back to EUC-KR", charsetName);
            return DEFAULT_CHARSET;
        }
    }
}
