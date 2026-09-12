package com.cyl.manager.act.mapper;

import org.apache.ibatis.annotations.*;

/** Shared cycle lock orders sign-in claims against an administrator reset. */
public interface SignInCycleMapper {
    @Select("SELECT version FROM act_sign_in_cycle WHERE id=1 LOCK IN SHARE MODE")
    Long lockCurrentVersion();

    @Select("SELECT version FROM act_sign_in_cycle WHERE id=1")
    Long currentVersion();

    @Update("UPDATE act_sign_in_cycle SET version=version+1, update_time=NOW() WHERE id=1 AND version=#{version}")
    int reset(Long version);
}
