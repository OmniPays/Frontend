describe('Connect Wallet', () => {
  it('should connect the detected Freighter wallet', () => {
    cy.visit('/', {
      onBeforeLoad: (win: any) => {
        win.freighter = {
          isConnected: () => true,
          getPublicKey: () =>
            Promise.resolve('GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP'),
          signTransaction: () => Promise.resolve('signedTransaction'),
        };
      },
    });

    cy.get('[data-testid="primary-button"]').click();
    cy.contains('Detected');
    cy.contains('Freighter Wallet').click();

    cy.contains('Connect a wallet to continue').should('not.exist');
    cy.contains('GCHR5...ZYBWP').should('be.visible');
  });
});
