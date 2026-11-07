package com.ANB.Config;

import com.ANB.Controller.AuthController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ApiSessionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        HttpSession session = request.getSession(false);

        Object usuarioId = session == null
                ? null
                : session.getAttribute(AuthController.SESSION_USER_ID);

        if (usuarioId instanceof Long) {

            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        response.setCharacterEncoding("UTF-8");

        response.setContentType("application/json");

        response.getWriter().write(
                "{\"mensaje\":\"Debes iniciar sesión para acceder a esta operación.\"}");

        return false;
    }
}