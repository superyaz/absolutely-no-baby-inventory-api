package com.ANB.Models.Service;

import com.ANB.Models.Entity.Usuario;
import com.ANB.Models.Repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UsuarioService extends AbstractCrudService<Usuario, Long> {

    private final PasswordHasher passwordHasher;

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(
            UsuarioRepository repository,
            PasswordHasher passwordHasher) {

        super(repository, Usuario::setIdUsuario);

        this.usuarioRepository = repository;

        this.passwordHasher = passwordHasher;
    }

    @Override
    @Transactional
    public Usuario create(Usuario entity) {

        validarEmailDisponible(entity.getEmail(), null);

        if (entity.getPassword() == null ||
                entity.getPassword().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña es obligatoria.");
        }

        validarLongitudPassword(entity.getPassword());

        if (entity.getRol() == null ||
                entity.getRol().getIdRol() == null ||
                entity.getSucursal() == null ||
                entity.getSucursal().getIdSucursal() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes asignar un rol y una sucursal.");
        }

        entity.setNombre(entity.getNombre().trim());

        entity.setApellido(entity.getApellido().trim());

        entity.setEmail(entity.getEmail().trim());

        entity.setPassword(
                passwordHasher.hash(entity.getPassword()));

        if (entity.getFechaCreacion() == null) {
            entity.setFechaCreacion(LocalDateTime.now());
        }

        if (entity.getActivo() == null) {
            entity.setActivo(true);
        }

        return super.create(entity);
    }

    @Override
    @Transactional
    public Usuario update(Long id, Usuario entity) {

        Usuario existente = findById(id);

        validarEmailDisponible(entity.getEmail(), id);

        entity.setNombre(entity.getNombre().trim());

        entity.setApellido(entity.getApellido().trim());

        entity.setEmail(entity.getEmail().trim());

        String nuevaPassword = entity.getPassword();

        if (nuevaPassword == null || nuevaPassword.isBlank()) {

            entity.setPassword(existente.getPassword());

        } else {

            validarLongitudPassword(nuevaPassword);

            entity.setPassword(
                    passwordHasher.hash(nuevaPassword));

        }

        entity.setFechaCreacion(
                existente.getFechaCreacion());

        if (entity.getActivo() == null) {
            entity.setActivo(existente.getActivo());
        }

        if (entity.getRol() == null ||
                entity.getRol().getIdRol() == null) {

            entity.setRol(existente.getRol());
        }

        if (entity.getSucursal() == null ||
                entity.getSucursal().getIdSucursal() == null) {

            entity.setSucursal(existente.getSucursal());
        }

        return super.update(id, entity);
    }

    @Transactional
    public void eliminarUsuario(Long id, Long usuarioSolicitanteId) {

        if (Objects.equals(id, usuarioSolicitanteId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No puedes eliminar tu propia cuenta de administrador.");

        }

        Usuario usuario = findById(id);

        boolean esAdministrador = usuario.getRol() != null &&
                "ADMINISTRADOR".equalsIgnoreCase(
                        usuario.getRol().getNombre());

        if (esAdministrador &&
                Boolean.TRUE.equals(usuario.getActivo())) {

            long administradoresActivos = usuarioRepository.findAll()
                    .stream()
                    .filter(u -> Boolean.TRUE.equals(u.getActivo()))
                    .filter(u -> u.getRol() != null)
                    .filter(u -> "ADMINISTRADOR".equalsIgnoreCase(
                            u.getRol().getNombre()))
                    .count();

            if (administradoresActivos <= 1) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No puedes eliminar al último administrador activo.");

            }
        }

        super.delete(id);
    }

    private void validarEmailDisponible(
            String email,
            Long idExcluir) {

        usuarioRepository.findByEmailIgnoreCase(email.trim())
                .ifPresent(usuario -> {

                    if (!Objects.equals(
                            usuario.getIdUsuario(),
                            idExcluir)) {

                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Ya existe un usuario registrado con ese correo electrónico.");
                    }
                });
    }

    private void validarLongitudPassword(String password) {

        if (password.length() < 8) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener al menos 8 caracteres.");

        }
    }

}