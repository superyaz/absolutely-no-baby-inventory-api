package com.ANB.Models.Service;

import com.ANB.Models.Entity.RolPermiso;
import com.ANB.Models.Repository.RolPermisoRepository;
import org.springframework.stereotype.Service;

@Service
public class RolPermisoService extends AbstractCrudService<RolPermiso, Long> {
    public RolPermisoService(RolPermisoRepository repository) {
        super(repository, RolPermiso::setIdRolPermisos);
    }
}
