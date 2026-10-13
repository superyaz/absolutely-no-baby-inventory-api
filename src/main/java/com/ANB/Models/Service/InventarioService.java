package com.ANB.Models.Service;

import com.ANB.Models.Entity.Inventario;
import com.ANB.Models.Repository.InventarioRepository;
import org.springframework.stereotype.Service;

@Service
public class InventarioService extends AbstractCrudService<Inventario, Long> {
    public InventarioService(InventarioRepository repository) {
        super(repository, Inventario::setIdInventario);
    }
}
