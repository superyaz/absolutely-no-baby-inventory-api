package com.ANB.Controller;

import com.ANB.Models.DTO.LoginRequest;
import com.ANB.Models.DTO.UsuarioSesionDTO;
import com.ANB.Models.Entity.Usuario;
import com.ANB.Models.Repository.UsuarioRepository;
import com.ANB.Models.Service.PasswordHasher;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public static final String SESSION_USER_ID = "ANB_USUARIO_ID";

    private final UsuarioRepository usuarioRepository;
    private final PasswordHasher passwordHasher;

    public AuthController(
            UsuarioRepository usuarioRepository,
            PasswordHasher passwordHasher) {

        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioSesionDTO> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest) {

        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Correo o contraseña incorrectos."));

        if (!Boolean.TRUE.equals(usuario.getActivo())
                || !passwordHasher.matches(
                        request.password(),
                        usuario.getPassword())) {

            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Correo o contraseña incorrectos.");
        }

        HttpSession session = servletRequest.getSession(true);

        servletRequest.changeSessionId();

        session.setAttribute(
                SESSION_USER_ID,
                usuario.getIdUsuario());

        session.setMaxInactiveInterval(8 * 60 * 60);

        return ResponseEntity.ok(convertirDTO(usuario));
    }

    @GetMapping("/me")
    public UsuarioSesionDTO usuarioActual(HttpSession session) {

        Long usuarioId = obtenerUsuarioId(session);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "La sesión ya no es válida."));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {

            session.invalidate();

            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "El usuario está inactivo.");
        }

        return convertirDTO(usuario);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {

        session.invalidate();

        return ResponseEntity.noContent().build();
    }

    public static Long obtenerUsuarioId(HttpSession session) {

        Object value = session.getAttribute(SESSION_USER_ID);

        if (!(value instanceof Long usuarioId)) {

            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debes iniciar sesión para realizar esta operación.");
        }

        return usuarioId;
    }

    private UsuarioSesionDTO convertirDTO(Usuario usuario) {

        return new UsuarioSesionDTO(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol().getNombre(),
                usuario.getSucursal().getIdSucursal(),
                usuario.getSucursal().getNombre(),
                usuario.getSucursal().getCiudad());
    }
}