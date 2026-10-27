package com.ANB.Models.Repository;

import com.ANB.Models.Entity.Temporada;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemporadaRepository
        extends JpaRepository<Temporada, Long> {

    List<Temporada> findByActivoTrue();
}