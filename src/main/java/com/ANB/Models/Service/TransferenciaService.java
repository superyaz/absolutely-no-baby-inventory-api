package com.ANB.Models.Service;

import com.ANB.Models.Entity.Transferencia;
import com.ANB.Models.Repository.TransferenciaRepository;
import org.springframework.stereotype.Service;

@Service
public class TransferenciaService extends AbstractCrudService<Transferencia, Long> {
    public TransferenciaService(TransferenciaRepository repository) {
        super(repository, Transferencia::setIdTransferencia);
    }
}
