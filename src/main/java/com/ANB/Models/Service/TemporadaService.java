package com.ANB.Models.Service;

import com.ANB.Models.Entity.Temporada;
import com.ANB.Models.Repository.TemporadaRepository;
import org.springframework.stereotype.Service;

@Service
public class TemporadaService extends AbstractCrudService<Temporada, Long> {
    public TemporadaService(TemporadaRepository repository) {
        super(repository, Temporada::setIdTemporada);
    }
}
