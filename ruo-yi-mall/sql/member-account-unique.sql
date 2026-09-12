-- Apply before enabling self-service registration. Existing duplicates must be resolved first.
ALTER TABLE ums_member ADD UNIQUE INDEX uk_member_phone_encrypted (phone_encrypted);
