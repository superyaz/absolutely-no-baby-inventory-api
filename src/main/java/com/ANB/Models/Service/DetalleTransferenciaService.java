package com.ANB.Models.Service;

import com.ANB.Models.Entity.DetalleTransferencia;
import com.ANB.Models.Repository.DetalleTransferenciaRepository;
import org.springframework.stereotype.Service;

@Service
public class DetalleTransferenciaService extends AbstractCrudService<DetalleTransferencia, Long> {
    public DetalleTransferenciaService(DetalleTransferenciaRepository repository) {
        super(repository, DetalleTransferencia::setIdDetalleTransferencia);
    }
}
