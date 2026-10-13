package com.ANB.Models.Service;

import com.ANB.Models.Entity.DetalleMovimiento;
import com.ANB.Models.Repository.DetalleMovimientoRepository;
import org.springframework.stereotype.Service;

@Service
public class DetalleMovimientoService extends AbstractCrudService<DetalleMovimiento, Long> {
    public DetalleMovimientoService(DetalleMovimientoRepository repository) {
        super(repository, DetalleMovimiento::setIdDetalleMovimiento);
    }
}
