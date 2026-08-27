package com.ttesicg.sante.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

import java.io.IOException;
import java.util.List;


@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {


    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    )
            throws ServletException, IOException {
        System.out.println("===== JWT FILTER EXECUTE =====");
        System.out.println("METHOD : " + request.getMethod());
        System.out.println("URI : " + request.getRequestURI());

        String authHeader = request.getHeader("Authorization");

        System.out.println("Authorization : " + authHeader);



        if(authHeader == null || !authHeader.startsWith("Bearer ")){

            filterChain.doFilter(request,response);
            return;
        }


        String token = authHeader.substring(7);


        if(jwtService.isValid(token)) {


            String email = jwtService.extractUsername(token);


            var userDetails =
                    userDetailsService.loadUserByUsername(email);

            System.out.println("===== USER AUTHENTICATED =====");
            System.out.println("Email : " + email);
            System.out.println("Enabled : " + userDetails.isEnabled());
            System.out.println("Authorities : " + userDetails.getAuthorities());



            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );


            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        }


        filterChain.doFilter(request,response);
    }
}