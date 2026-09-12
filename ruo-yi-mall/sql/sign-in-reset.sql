-- Apply once. Existing claims stay in cycle 0; no points or history are removed.
CREATE TABLE act_sign_in_cycle (
 id INT PRIMARY KEY,
 version BIGINT NOT NULL DEFAULT 0,
 update_time DATETIME NOT NULL
) ENGINE=InnoDB;
INSERT INTO act_sign_in_cycle VALUES (1,0,NOW());
ALTER TABLE act_integral_history ADD sign_in_version BIGINT NOT NULL DEFAULT 0;
CREATE INDEX idx_sign_in_cycle ON act_integral_history(sub_op_type,sign_in_version,create_time,member_id);
