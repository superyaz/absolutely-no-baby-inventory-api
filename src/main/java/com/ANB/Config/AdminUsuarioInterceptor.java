package com.ANB.Config;

import com.ANB.Controller.AuthController;
import com.ANB.Models.Entity.Usuario;
import com.ANB.Models.Repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminUsuarioInterceptor implements HandlerInterceptor {

    private final UsuarioRepository usuarioRepository;

    public AdminUsuarioInterceptor(
            UsuarioRepository usuarioRepository) {

        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        HttpSession session = request.getSession(false);

        Object usuarioId = session == null
                ? null
                : session.getAttribute(AuthController.SESSION_USER_ID);

        if (!(usuarioId instanceof Long id)) {

            escribirRespuesta(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Debes iniciar sesión.");

            return false;
        }

        Usuario usuario = usuarioRepository.findById(id).orElse(null);

        if (usuario == null ||
                !Boolean.TRUE.equals(usuario.getActivo())) {

            if (session != null) {
                session.invalidate();
            }

            escribirRespuesta(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "La sesión no es válida o el usuario está inactivo.");

            return false;
        }

        boolean esAdministrador = usuario.getRol() != null &&
                "ADMINISTRADOR".equalsIgnoreCase(
                        usuario.getRol().getNombre());

        if (!esAdministrador) {

            escribirRespuesta(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    "No tienes permisos de administrador para realizar esta operación.");

            return false;
        }

        return true;
    }

    private void escribirRespuesta(
            HttpServletResponse response,
            int status,
            String mensaje) throws IOException {

        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");

        response.getWriter().write(
                "{\"mensaje\":\"" + mensaje + "\"}");
    }
}