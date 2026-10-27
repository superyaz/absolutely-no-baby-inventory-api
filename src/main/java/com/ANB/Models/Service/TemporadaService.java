package com.ANB.Models.Service;

import com.ANB.Models.Entity.Temporada;
import com.ANB.Models.Repository.TemporadaRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemporadaService
        extends AbstractCrudService<Temporada, Long> {

    private final TemporadaRepository repository;

    public TemporadaService(TemporadaRepository repository) {
        super(repository, Temporada::setIdTemporada);
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Temporada> listarActivas() {
        return repository.findByActivoTrue();
    }
}