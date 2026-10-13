package com.ANB.Models.Service;

import com.ANB.Models.Entity.Auditoria;
import com.ANB.Models.Repository.AuditoriaRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditoriaService extends AbstractCrudService<Auditoria, Long> {
    public AuditoriaService(AuditoriaRepository repository) {
        super(repository, Auditoria::setIdAuditoria);
    }
}
