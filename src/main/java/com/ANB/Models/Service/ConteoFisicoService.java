package com.ANB.Models.Service;

import com.ANB.Models.Entity.ConteoFisico;
import com.ANB.Models.Repository.ConteoFisicoRepository;
import org.springframework.stereotype.Service;

@Service
public class ConteoFisicoService extends AbstractCrudService<ConteoFisico, Long> {
    public ConteoFisicoService(ConteoFisicoRepository repository) {
        super(repository, ConteoFisico::setIdConteoFisico);
    }
}
