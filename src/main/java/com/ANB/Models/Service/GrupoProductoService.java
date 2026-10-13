package com.ANB.Models.Service;

import com.ANB.Models.Entity.GrupoProducto;
import com.ANB.Models.Repository.GrupoProductoRepository;
import org.springframework.stereotype.Service;

@Service
public class GrupoProductoService extends AbstractCrudService<GrupoProducto, String> {
    public GrupoProductoService(GrupoProductoRepository repository) {
        super(repository, GrupoProducto::setCodigoGrupo);
    }
}
