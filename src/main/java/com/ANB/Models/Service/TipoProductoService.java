package com.ANB.Models.Service;

import com.ANB.Models.Entity.TipoProducto;
import com.ANB.Models.Repository.TipoProductoRepository;
import org.springframework.stereotype.Service;

@Service
public class TipoProductoService extends AbstractCrudService<TipoProducto, String> {
    public TipoProductoService(TipoProductoRepository repository) {
        super(repository, TipoProducto::setCodigoTipoProducto);
    }
}
