package com.ANB.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ApiSessionInterceptor apiSessionInterceptor;

    public WebConfig(
            ApiSessionInterceptor apiSessionInterceptor) {

        this.apiSessionInterceptor = apiSessionInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(apiSessionInterceptor)

                .addPathPatterns("/api/**")

                .excludePathPatterns("/api/auth/login");
    }
}