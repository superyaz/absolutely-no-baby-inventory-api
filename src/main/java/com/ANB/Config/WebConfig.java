package com.ANB.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ApiSessionInterceptor apiSessionInterceptor;

    private final AdminUsuarioInterceptor adminUsuarioInterceptor;

    public WebConfig(
            ApiSessionInterceptor apiSessionInterceptor,
            AdminUsuarioInterceptor adminUsuarioInterceptor) {

        this.apiSessionInterceptor = apiSessionInterceptor;
        this.adminUsuarioInterceptor = adminUsuarioInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(apiSessionInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login");

        registry.addInterceptor(adminUsuarioInterceptor)
                .addPathPatterns(
                        "/api/usuarios/**",
                        "/api/roles/**",
                        "/api/sucursales/**");
    }
}