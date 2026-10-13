package com.ANB.Models.Service;

import com.ANB.Models.Entity.Movimiento;
import com.ANB.Models.Repository.MovimientoRepository;
import org.springframework.stereotype.Service;

@Service
public class MovimientoService extends AbstractCrudService<Movimiento, Long> {
    public MovimientoService(MovimientoRepository repository) {
        super(repository, Movimiento::setIdMovimiento);
    }
}
