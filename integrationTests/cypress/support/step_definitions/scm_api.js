const { Then } = require("cypress-cucumber-preprocessor/steps");

Then("the user can access the index", () => {
  cy.getIndex().then((response) => {
    Cypress.on('uncaught:exception', () => { return false; });
    expect(response.status).to.eq(200);
  });
});