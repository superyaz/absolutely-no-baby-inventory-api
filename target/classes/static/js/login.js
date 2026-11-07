'use strict';

const form = document.getElementById('loginForm');
const errorElement = document.getElementById('loginError');
const button = document.getElementById('loginButton');

form.addEventListener('submit', async event => {

    event.preventDefault();

    errorElement.textContent = '';

    button.disabled = true;
    button.textContent = 'Verificando...';

    try {

        const response = await fetch('/api/auth/login', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                email: document.getElementById('loginEmail').value.trim(),

                password: document.getElementById('loginPassword').value

            })

        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.mensaje || 'No se pudo iniciar sesión.'
            );
        }

        window.location.replace('/');

    } catch (error) {

        errorElement.textContent = error.message;

    } finally {

        button.disabled = false;
        button.textContent = 'Iniciar sesión';
    }

});