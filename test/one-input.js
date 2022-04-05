describe('One-Input', () => {
  let win = null;
  before(async () => {
    win = await cy.visit('http://localhost:8080/examples/input.html');
  });

  describe("Create a one-input element", () => {
    it('using createElement', async () => {
      const oneInput = win.document.createElement('one-input');
      const container = await cy.get('one-circle');
      container.html(oneInput);

      const element = container.find('one-input');
      expect(element).to.have.lengthOf(1);
    });

    it('using html', async () => {
      const html = '<one-input>Test</one-input>';
      const container = await cy.get('one-circle');
      container.html(html);

      const element = container.find('one-input');
      expect(element).to.have.lengthOf(1);
    });
  });
});