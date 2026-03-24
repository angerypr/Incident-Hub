const form = document.getElementById("loginForm");
const registerBtn = document.getElementById("goRegister");
const roleRadios = document.querySelectorAll('input[name="role"]');

if (roleRadios.length > 0) {
    roleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'admin') {
                if (registerBtn) registerBtn.style.display = 'none';
            } else {
                if (registerBtn) registerBtn.style.display = 'inline-block';
            }
        });
    });
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.querySelector('input[name="role"]:checked')?.value || 'user';
        const errorText = document.getElementById("error");

        errorText.textContent = "";

        if (!email || !password) {
            errorText.textContent = "Todos los campos son obligatorios.";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (!response.ok) {
                errorText.textContent = data.message;
                return;
            }

            localStorage.setItem("token", data.token);
            if (data._id) {
                localStorage.setItem("userId", data._id);
            }
            if (data.role) {
                localStorage.setItem("role", data.role);
            }
            if (data.email) {
                localStorage.setItem("userEmail", data.email);
            }

            if (data.role === 'admin') {
                window.location.href = "admin_dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            errorText.textContent = "No se pudo conectar al servidor.";
        }
    });
}

if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        window.location.href = "register.html";
    });
}
