package com.ANB.Models.Service;

import com.ANB.Models.Entity.Permiso;
import com.ANB.Models.Repository.PermisoRepository;
import org.springframework.stereotype.Service;

@Service
public class PermisoService extends AbstractCrudService<Permiso, Long> {
    public PermisoService(PermisoRepository repository) {
        super(repository, Permiso::setIdPermiso);
    }
}
