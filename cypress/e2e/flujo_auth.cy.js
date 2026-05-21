// cypress/e2e/flujo_auth.cy.js
describe('Flujo de autenticación SIGL', () => {
  const credenciales = {
    email: 'prueba@leads.com',
    password: 'prueba123'
  };

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/frontend/index.html');
    cy.wait(500);
  });

  it('Inicia sesión y verifica el estado del servidor', () => {
    cy.get('#login-email').type(credenciales.email, { force: true });
    cy.get('#login-password').type(credenciales.password, { force: true });
    cy.get('#btn-login').click({ force: true });
    cy.get('#vista-app', { timeout: 10000 }).should('be.visible');
    cy.get('[data-vista="config"]').click({ force: true });
    cy.get('#btn-health-check').click({ force: true });
    // ✅ Línea corregida:
    cy.get('#health-resultado', { timeout: 5000 }).should('contain', 'Conectada');
  });
});