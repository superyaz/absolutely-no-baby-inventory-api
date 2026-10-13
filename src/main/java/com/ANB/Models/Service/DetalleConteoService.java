package com.ANB.Models.Service;

import com.ANB.Models.Entity.DetalleConteo;
import com.ANB.Models.Repository.DetalleConteoRepository;
import org.springframework.stereotype.Service;

@Service
public class DetalleConteoService extends AbstractCrudService<DetalleConteo, Long> {
    public DetalleConteoService(DetalleConteoRepository repository) {
        super(repository, DetalleConteo::setIdDetalleConteo);
    }
}
