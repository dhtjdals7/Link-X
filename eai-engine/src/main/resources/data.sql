-- ============================================
-- Link-X 초기 데이터: 샘플 전문 레이아웃
-- ============================================

-- 계좌이체 전문 (HEADER)
INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 1, 'MSG_LEN', '전문길이', 4, 'NUMBER', 'RIGHT', '0', '', true, '전체 전문 길이 (헤더 포함)', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 2, 'MSG_TYPE', '전문구분', 4, 'STRING', 'LEFT', ' ', '0200', true, '0200:요청, 0210:응답', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 3, 'TRAN_CD', '거래코드', 6, 'STRING', 'LEFT', ' ', 'TR0001', true, '업무 거래코드', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 4, 'SEND_DATE', '전송일자', 8, 'DATE', 'LEFT', ' ', '', true, 'YYYYMMDD', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 5, 'SEND_TIME', '전송시간', 6, 'STRING', 'LEFT', ' ', '', false, 'HHmmss', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 6, 'RESP_CD', '응답코드', 4, 'STRING', 'LEFT', ' ', '0000', false, '0000:정상', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 7, 'CHANNEL_ID', '채널구분', 2, 'STRING', 'LEFT', ' ', 'IB', false, 'IB:인터넷뱅킹, MB:모바일, AT:ATM', 'HEADER', true);

-- 계좌이체 전문 (BODY)
INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 8, 'OUT_ACCT_NO', '출금계좌번호', 16, 'STRING', 'LEFT', ' ', '', true, '하이픈 제외', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 9, 'IN_ACCT_NO', '입금계좌번호', 16, 'STRING', 'LEFT', ' ', '', true, '하이픈 제외', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 10, 'IN_BANK_CD', '입금은행코드', 3, 'STRING', 'LEFT', ' ', '', true, '금융기관 코드', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 11, 'TRAN_AMT', '이체금액', 13, 'NUMBER', 'RIGHT', '0', '0', true, '원 단위', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 12, 'OUT_ACCT_NM', '출금계좌예금주', 20, 'STRING', 'LEFT', ' ', '', false, '', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 13, 'IN_ACCT_NM', '입금계좌예금주', 20, 'STRING', 'LEFT', ' ', '', false, '', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 14, 'MEMO', '적요', 20, 'STRING', 'LEFT', ' ', '', false, '입금통장 표시 내용', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('TR0001', '계좌이체', 15, 'FILLER', '예비', 8, 'FILLER', 'LEFT', ' ', '', false, '', 'BODY', true);

-- 잔액조회 전문 (HEADER)
INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 1, 'MSG_LEN', '전문길이', 4, 'NUMBER', 'RIGHT', '0', '', true, '', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 2, 'MSG_TYPE', '전문구분', 4, 'STRING', 'LEFT', ' ', '0200', true, '', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 3, 'TRAN_CD', '거래코드', 6, 'STRING', 'LEFT', ' ', 'INQ001', true, '', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 4, 'SEND_DATE', '전송일자', 8, 'DATE', 'LEFT', ' ', '', true, '', 'HEADER', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 5, 'RESP_CD', '응답코드', 4, 'STRING', 'LEFT', ' ', '0000', false, '', 'HEADER', true);

-- 잔액조회 전문 (BODY)
INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 6, 'ACCT_NO', '계좌번호', 16, 'STRING', 'LEFT', ' ', '', true, '', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 7, 'ACCT_NM', '예금주명', 20, 'STRING', 'LEFT', ' ', '', false, '', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 8, 'BALANCE', '잔액', 15, 'NUMBER', 'RIGHT', '0', '0', false, '원 단위', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 9, 'AVAIL_AMT', '출금가능액', 15, 'NUMBER', 'RIGHT', '0', '0', false, '원 단위', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 10, 'ACCT_TYPE', '계좌종류', 2, 'STRING', 'LEFT', ' ', '', false, '01:보통예금, 02:정기예금', 'BODY', true);

INSERT INTO tb_telegram_layout (telegram_id, telegram_name, field_seq, field_name, field_name_kr, field_length, data_type, align, pad_char, default_value, required, description, section, active)
VALUES ('INQ001', '잔액조회', 11, 'CURR_CD', '통화코드', 3, 'STRING', 'LEFT', ' ', 'KRW', false, '', 'BODY', true);
