package com.ANB.Models.Service;

import com.ANB.Models.Entity.Sucursal;
import com.ANB.Models.Repository.SucursalRepository;
import org.springframework.stereotype.Service;

@Service
public class SucursalService extends AbstractCrudService<Sucursal, Long> {
    public SucursalService(SucursalRepository repository) {
        super(repository, Sucursal::setIdSucursal);
    }
}
