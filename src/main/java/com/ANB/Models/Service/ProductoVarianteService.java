package com.ANB.Models.Service;

import com.ANB.Models.Entity.ProductoVariante;
import com.ANB.Models.Repository.ProductoVarianteRepository;
import org.springframework.stereotype.Service;

@Service
public class ProductoVarianteService extends AbstractCrudService<ProductoVariante, Long> {
    public ProductoVarianteService(ProductoVarianteRepository repository) {
        super(repository, ProductoVariante::setIdProductoVariante);
    }
}
