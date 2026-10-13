package com.ANB.Models.Service;

import com.ANB.Models.Entity.TipoMovimiento;
import com.ANB.Models.Repository.TipoMovimientoRepository;
import org.springframework.stereotype.Service;

@Service
public class TipoMovimientoService extends AbstractCrudService<TipoMovimiento, Long> {
    public TipoMovimientoService(TipoMovimientoRepository repository) {
        super(repository, TipoMovimiento::setIdTipoMovimiento);
    }
}
